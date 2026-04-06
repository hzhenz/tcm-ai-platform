import os

from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from openai import OpenAI

embeddings = HuggingFaceEmbeddings(model_name="shibing624/text2vec-base-chinese")
vector_db = Chroma(persist_directory="./tcm_chroma_db", embedding_function=embeddings)

client = OpenAI(
    api_key=os.getenv("DEEPSEEK_API_KEY", "sk-a567cf2d96074f4e92fafbc71225cb5e"),
    base_url=os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com"),
)


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
