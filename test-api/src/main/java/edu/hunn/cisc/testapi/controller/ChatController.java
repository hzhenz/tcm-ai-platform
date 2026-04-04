package edu.hunn.cisc.testapi.controller;

import edu.hunn.fisc.testapi.service.DeepSeekService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin
public class ChatController {

    @Autowired
    private DeepSeekService deepSeekService;

    @PostMapping("/send")
    public Map<String, String> send(@RequestBody Map<String, String> request) {
        String userMessage = request.get("message");
        String reply = deepSeekService.chat(userMessage);
        return Map.of("reply", reply);
    }
}