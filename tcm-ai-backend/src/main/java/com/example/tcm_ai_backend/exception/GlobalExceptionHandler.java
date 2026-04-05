package com.example.tcm_ai_backend.exception;

import com.example.tcm_ai_backend.utils.Result;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public Result<String> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::formatFieldError)
                .collect(Collectors.joining("; "));
        return Result.error(message);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public Result<String> handleBodyParseException(HttpMessageNotReadableException ex) {
        return Result.error("请求体格式错误，请检查 JSON 结构");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public Result<String> handleIllegalArgument(IllegalArgumentException ex) {
        return Result.error(ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public Result<String> handleIllegalState(IllegalStateException ex) {
        return Result.error(ex.getMessage());
    }

    @ExceptionHandler(BadCredentialsException.class)
    public Result<String> handleBadCredentials(BadCredentialsException ex) {
        return Result.error("用户名或密码错误");
    }

    @ExceptionHandler(Exception.class)
    public Result<String> handleUnknown(Exception ex) {
        return Result.error("服务器内部错误，请稍后重试");
    }

    private String formatFieldError(FieldError fieldError) {
        return fieldError.getField() + ": " + fieldError.getDefaultMessage();
    }
}
