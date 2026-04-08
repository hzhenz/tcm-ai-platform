package com.example.tcm_ai_backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.Charset;
import java.nio.charset.CharsetDecoder;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class AgentPythonAutomationBridge {

    private final ObjectMapper objectMapper;
    private final String pythonExec;
    private final String bookingScriptPath;
    private final String bookingMode;
    private final String bookingUrl;
    private final double bookingBrowserTimeoutSec;
    private final long timeoutMs;

    public AgentPythonAutomationBridge(
            ObjectMapper objectMapper,
            @Value("${app.agent.python.exec:python}") String pythonExec,
            @Value("${app.agent.python.booking-script:../Traditional Chinese Medicine expert/server/automation/mock_booking_executor.py}") String bookingScriptPath,
            @Value("${app.agent.python.booking-mode:mock}") String bookingMode,
            @Value("${app.agent.python.booking-url:https://www.cs4hospital.cn/}") String bookingUrl,
            @Value("${app.agent.python.booking-browser-timeout-sec:25}") double bookingBrowserTimeoutSec,
            @Value("${app.agent.python.timeout-ms:15000}") long timeoutMs
    ) {
        this.objectMapper = objectMapper;
        this.pythonExec = pythonExec;
        this.bookingScriptPath = bookingScriptPath;
        this.bookingMode = bookingMode;
        this.bookingUrl = bookingUrl;
        this.bookingBrowserTimeoutSec = bookingBrowserTimeoutSec;
        this.timeoutMs = timeoutMs;
    }

    public Map<String, Object> runBooking(String department, String date, String traceId) {
        Path script = resolveScriptPath();
        if (script == null) {
            return failure("SCRIPT_NOT_FOUND", "自动化脚本不存在，请检查配置", traceId);
        }

        List<String> command = new ArrayList<>();
        command.add(pythonExec);
        if (isLikelyPythonExecutable(pythonExec)) {
            // Force UTF-8 stdout/stderr for Windows console compatibility.
            command.add("-X");
            command.add("utf8");
        }
        command.add(script.toAbsolutePath().toString());
        command.add("--department");
        command.add(department);
        command.add("--date");
        command.add(date);
        command.add("--mode");
        command.add(bookingMode);
        command.add("--target-url");
        command.add(bookingUrl);
        command.add("--timeout-sec");
        command.add(String.valueOf(bookingBrowserTimeoutSec));
        command.add("--trace-id");
        command.add(traceId);

        ProcessBuilder processBuilder = new ProcessBuilder(command);
        processBuilder.redirectErrorStream(true);
        processBuilder.environment().put("PYTHONIOENCODING", "utf-8");
        processBuilder.environment().put("PYTHONUTF8", "1");

        List<String> outputLines = new ArrayList<>();

        try {
            Process process = processBuilder.start();
            boolean finished = process.waitFor(timeoutMs, TimeUnit.MILLISECONDS);
            if (!finished) {
                process.destroyForcibly();
                return failure("TIMEOUT", "自动化执行超时，已终止", traceId);
            }

            byte[] outputBytes = process.getInputStream().readAllBytes();
            String decodedOutput = decodeProcessOutput(outputBytes);
            if (!decodedOutput.isBlank()) {
                outputLines.addAll(Arrays.asList(decodedOutput.split("\\R")));
            }

            Map<String, Object> parsed = parseJsonOutput(outputLines);
            if (parsed == null) {
                return failure("INVALID_OUTPUT", "自动化脚本未返回有效JSON", traceId);
            }

            parsed.putIfAbsent("traceId", traceId);
            parsed.putIfAbsent("exitCode", process.exitValue());
            parsed.putIfAbsent("rawOutput", String.join("\n", outputLines));

            return parsed;
        } catch (IOException e) {
            return failure("IO_ERROR", "无法启动自动化脚本: " + e.getMessage(), traceId);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return failure("INTERRUPTED", "自动化执行被中断", traceId);
        }
    }

    private Path resolveScriptPath() {
        Path configured = Paths.get(bookingScriptPath);
        if (configured.isAbsolute() && Files.exists(configured)) {
            return configured;
        }

        Path workingDir = Paths.get(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        Path fromWorkingDir = workingDir.resolve(configured).normalize();
        if (Files.exists(fromWorkingDir)) {
            return fromWorkingDir;
        }

        Path fromParent = workingDir.getParent() == null ? null : workingDir.getParent().resolve(configured).normalize();
        if (fromParent != null && Files.exists(fromParent)) {
            return fromParent;
        }

        return null;
    }

    private Map<String, Object> parseJsonOutput(List<String> lines) {
        for (int i = lines.size() - 1; i >= 0; i--) {
            String line = lines.get(i);
            if (line == null || line.isBlank()) {
                continue;
            }
            try {
                return objectMapper.readValue(line, new TypeReference<LinkedHashMap<String, Object>>() {
                });
            } catch (Exception ignored) {
                // Continue scanning previous lines until we find JSON.
            }
        }
        return null;
    }

    private String decodeProcessOutput(byte[] outputBytes) {
        if (outputBytes == null || outputBytes.length == 0) {
            return "";
        }

        String utf8 = decodeStrict(outputBytes, StandardCharsets.UTF_8);
        if (utf8 != null) {
            return utf8;
        }

        String gbk = decodeStrict(outputBytes, Charset.forName("GBK"));
        if (gbk != null) {
            return gbk;
        }

        // Keep a readable fallback even if bytes contain mixed encodings.
        return new String(outputBytes, StandardCharsets.UTF_8);
    }

    private String decodeStrict(byte[] bytes, Charset charset) {
        CharsetDecoder decoder = charset.newDecoder()
                .onMalformedInput(CodingErrorAction.REPORT)
                .onUnmappableCharacter(CodingErrorAction.REPORT);
        try {
            CharBuffer charBuffer = decoder.decode(ByteBuffer.wrap(bytes));
            return charBuffer.toString();
        } catch (CharacterCodingException e) {
            return null;
        }
    }

    private Map<String, Object> failure(String code, String message, String traceId) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "failed");
        result.put("errorCode", code);
        result.put("message", message);
        result.put("traceId", traceId);
        return result;
    }

    private boolean isLikelyPythonExecutable(String executable) {
        if (executable == null) {
            return false;
        }
        String lower = executable.trim().toLowerCase(Locale.ROOT);
        return lower.equals("python") || lower.equals("python3") || lower.endsWith("python.exe") || lower.endsWith("python3.exe");
    }
}
