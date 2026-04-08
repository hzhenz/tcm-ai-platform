package com.example.tcm_ai_backend.dto.agent.brain;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class AgentBrainTurnData {

    private boolean handled;
    private String reply;
    private String traceId;
    private List<AgentBrainAction> actions = new ArrayList<>();
    private Map<String, Object> debug;

    public boolean isHandled() {
        return handled;
    }

    public void setHandled(boolean handled) {
        this.handled = handled;
    }

    public String getReply() {
        return reply;
    }

    public void setReply(String reply) {
        this.reply = reply;
    }

    public String getTraceId() {
        return traceId;
    }

    public void setTraceId(String traceId) {
        this.traceId = traceId;
    }

    public List<AgentBrainAction> getActions() {
        return actions;
    }

    public void setActions(List<AgentBrainAction> actions) {
        this.actions = actions;
    }

    public Map<String, Object> getDebug() {
        return debug;
    }

    public void setDebug(Map<String, Object> debug) {
        this.debug = debug;
    }
}
