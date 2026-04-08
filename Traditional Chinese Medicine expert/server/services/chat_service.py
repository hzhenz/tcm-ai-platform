import os
import json
import re
from typing import Optional

from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from openai import OpenAI

embeddings = HuggingFaceEmbeddings(model_name="shibing624/text2vec-base-chinese")
vector_db = Chroma(persist_directory="./tcm_chroma_db", embedding_function=embeddings)

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", "sk-a567cf2d96074f4e92fafbc71225cb5e"),
    base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
)


DEFAULT_TOOL_DEFINITIONS = [
    {
        "name": "book_expert_appointment",
        "description": "自动预约中医专家号",
        "parameters": {
            "department": "string",
            "date": "string",
            "autoExecute": "boolean"
        }
    },
    {
        "name": "route_to_page",
        "description": "跳转到站内页面",
        "parameters": {
            "targetPath": "string",
            "presetPrompt": "string"
        }
    },
    {
        "name": "open_task_center",
        "description": "打开任务中心",
        "parameters": {}
    }
]


def generate_chat_reply(user_input: str, history: list) -> str:
    docs = vector_db.similarity_search(user_input, k=2)
    retrieved_context = "".join([f"\n{doc.page_content}\n" for doc in docs])

    rag_prompt = f"""
            你是一位拥有40年临床经验的国家级名老中医，擅长通过中医体质学说进行养生调理。
            请严格根据以下我为你最新检索出的【中医古籍资料】来分析用户的症状。

            【为你检索到的相关中医资料】：
            {retrieved_context}

            【你的思考与回答逻辑】：
            1. 风险排查与症状提取：分析用户描述的不适。如果涉及胸部、心脏等可能危及生命的症状，务必委婉但坚定地建议先进行现代医学检查（如心电图）排除器质性病变。
            2. 体质判定与原理解析：将症状与检索资料对齐，明确判定用户属于哪种体质或气血状态。
               -> 核心要求：必须结合检索资料中的【形成原因/成因】向用户解释为什么会这样。
               -> 核心要求：主动列出该体质可能潜在的【其他表现】或【特征描述】（如：这类体质的人往往还会伴随...），以此增加专业说服力，让用户产生共鸣。
            3. 给出精细方案：严格从检索资料中提取处方。
               -> 饮食：明确指出【宜吃食物】和绝对的【忌吃食物】。
               -> 穴位：挑选1-2个【特效穴位】，必须写出其“功效”和“按摩方法”。
               -> 起居：调取对应的精神或起居建议。
            4. 语气规范：温柔、耐心、专业，像长辈一样关怀。⚠️严禁在回复中使用括号描写动作（如不要写“微笑着说”、“神情关切”等），保持真实医生的专业感。
            5. 底线要求：结尾必须独立成段，包含免责声明：“本建议仅供日常养生参考，不替代专业医疗诊断。如症状严重请及时就医。”

            【主动问诊机制（望闻问切铁律）】：
            当用户只提供极少症状（少于3个）无法准确判定时，挑选2-3个细节以1、2、3分点反问用户。

            ⚠️【绝不可违背的禁忌】：
            你是一位干脆利落的真实老中医，不是啰嗦的AI助理！医生问诊时绝对不会向病人解释“我为什么要问你”。
            你必须直接进行分析，然后直接抛出问题！绝对、绝对不许出现任何解释性、过渡性的废话！
            严禁以第三人称科普“中医”：你就是大夫本人！绝对不许说“中医认为”、“在中医看来”、“中医里头痛原因很多”。直接说“头痛原因很多”或直接陈述医理！

            ❌ 【严禁出现的错误句式（千万不能这么说）】：
            “这就好像中医里的望闻问切一样，我需要多问几句...”
            """

    messages = [{"role": "system", "content": rag_prompt}]
    messages.extend(history)
    messages.append({"role": "user", "content": user_input})

    response = client.chat.completions.create(
        model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
        messages=messages,
        temperature=0.1,
        stream=False,
    )
    return response.choices[0].message.content


def generate_tool_plan(user_input: str, history: Optional[list] = None, current_path: str = "", tools: Optional[list] = None) -> dict:
    history = history or []
    tools = tools or DEFAULT_TOOL_DEFINITIONS

    planner_prompt = """
你是 AI Agent 的工具规划器。你只能输出一个 JSON 对象，不要输出 markdown，不要输出额外解释。

输出 JSON Schema:
{
  "intent": "string",
  "toolName": "string",
  "arguments": {"key": "value"},
  "confidence": 0.0,
  "reason": "string"
}

规则:
1) 如果需要自动挂号，toolName 必须是 book_expert_appointment，arguments 中至少包含 department 与 date。
    仅当用户明确表达“挂号/预约/约号/门诊”动作意图时才能使用该工具；
    如果用户只是表达“不舒服/难受/头痛/咳嗽”等症状，必须返回 toolName=none。
2) 如果用户是页面跳转诉求，toolName 用 route_to_page，并提供 targetPath。
3) 如果用户想看任务/审批，toolName 用 open_task_center。
4) 无法确定时 toolName 返回 none，intent 返回 unknown。
5) confidence 取 0-1 之间小数。
""".strip()

    compact_history = []
    for message in history[-6:]:
        if not isinstance(message, dict):
            continue
        role = str(message.get("role", "")).strip()
        content = str(message.get("content", "")).strip()
        if not role or not content:
            continue
        compact_history.append({"role": role, "content": content})

    user_payload = {
        "currentPath": current_path,
        "userInput": user_input,
        "availableTools": tools,
        "history": compact_history,
    }

    response = client.chat.completions.create(
        model=os.getenv("DEEPSEEK_MODEL", "deepseek-chat"),
        messages=[
            {"role": "system", "content": planner_prompt},
            {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
        ],
        temperature=0.0,
        stream=False,
    )
    content = response.choices[0].message.content or ""
    return _parse_tool_plan_response(content)


def _parse_tool_plan_response(content: str) -> dict:
    raw = (content or "").strip()
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?", "", raw).strip()
        raw = re.sub(r"```$", "", raw).strip()

    parsed = None
    try:
        parsed = json.loads(raw)
    except Exception:
        match = re.search(r"\{[\s\S]*\}", raw)
        if match:
            try:
                parsed = json.loads(match.group(0))
            except Exception:
                parsed = None

    if not isinstance(parsed, dict):
        return {
            "intent": "unknown",
            "toolName": "none",
            "arguments": {},
            "confidence": 0.0,
            "reason": "tool planner output is not valid json",
        }

    intent = str(parsed.get("intent", "unknown") or "unknown").strip()
    tool_name = str(parsed.get("toolName", "none") or "none").strip()
    arguments = parsed.get("arguments")
    if not isinstance(arguments, dict):
        arguments = {}

    try:
        confidence = float(parsed.get("confidence", 0.0) or 0.0)
    except Exception:
        confidence = 0.0
    confidence = max(0.0, min(1.0, confidence))

    reason = str(parsed.get("reason", "") or "").strip()

    return {
        "intent": intent,
        "toolName": tool_name,
        "arguments": arguments,
        "confidence": confidence,
        "reason": reason,
    }
