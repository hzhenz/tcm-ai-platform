package com.example.tcm_ai_backend.service;

import com.example.tcm_ai_backend.dto.agent.brain.AgentBrainProgressEvent;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class AgentBrainProgressService {

    private static final int MAX_EVENTS = 200;
    private static final long EXPIRE_MS = 30L * 60L * 1000L;

    private final ConcurrentHashMap<String, SessionProgress> sessions = new ConcurrentHashMap<>();

    public void start(Long userId, String sessionId, String traceId) {
        cleanupExpired();
        String key = key(userId, sessionId);
        SessionProgress progress = new SessionProgress();
        progress.traceId = traceId;
        progress.running = true;
        progress.updatedAt = System.currentTimeMillis();
        sessions.put(key, progress);
    }

    public void publish(Long userId, String sessionId, String traceId, String stage, String message) {
        if (message == null || message.isBlank()) {
            return;
        }
        String key = key(userId, sessionId);
        SessionProgress progress = sessions.computeIfAbsent(key, unused -> {
            SessionProgress created = new SessionProgress();
            created.traceId = traceId;
            created.running = true;
            created.updatedAt = System.currentTimeMillis();
            return created;
        });

        synchronized (progress) {
            progress.cursor += 1;
            AgentBrainProgressEvent event = new AgentBrainProgressEvent();
            event.setIndex(progress.cursor);
            event.setTraceId(traceId);
            event.setStage(stage);
            event.setMessage(message);
            event.setTimestamp(System.currentTimeMillis());
            progress.events.add(event);

            int overflow = progress.events.size() - MAX_EVENTS;
            if (overflow > 0) {
                progress.events.subList(0, overflow).clear();
            }
            progress.updatedAt = System.currentTimeMillis();
        }
    }

    public void complete(Long userId, String sessionId) {
        String key = key(userId, sessionId);
        SessionProgress progress = sessions.get(key);
        if (progress == null) {
            return;
        }

        synchronized (progress) {
            progress.running = false;
            progress.updatedAt = System.currentTimeMillis();
        }
    }

    public Map<String, Object> fetch(Long userId, String sessionId, long sinceCursor) {
        cleanupExpired();
        String key = key(userId, sessionId);
        SessionProgress progress = sessions.get(key);

        Map<String, Object> result = new LinkedHashMap<>();
        if (progress == null) {
            result.put("events", List.of());
            result.put("nextCursor", sinceCursor);
            result.put("running", false);
            return result;
        }

        synchronized (progress) {
            List<AgentBrainProgressEvent> events = new ArrayList<>();
            for (AgentBrainProgressEvent event : progress.events) {
                if (event.getIndex() > sinceCursor) {
                    events.add(event);
                }
            }
            result.put("events", events);
            result.put("nextCursor", progress.cursor);
            result.put("running", progress.running);
            result.put("traceId", progress.traceId);
            return result;
        }
    }

    private void cleanupExpired() {
        long now = System.currentTimeMillis();
        sessions.entrySet().removeIf(entry -> now - entry.getValue().updatedAt > EXPIRE_MS);
    }

    private String key(Long userId, String sessionId) {
        return userId + ":" + normalizeSessionId(sessionId);
    }

    private String normalizeSessionId(String sessionId) {
        if (sessionId == null) {
            return "";
        }
        return sessionId.trim();
    }

    private static class SessionProgress {
        private String traceId;
        private long cursor;
        private boolean running;
        private long updatedAt;
        private final List<AgentBrainProgressEvent> events = new ArrayList<>();
    }
}
