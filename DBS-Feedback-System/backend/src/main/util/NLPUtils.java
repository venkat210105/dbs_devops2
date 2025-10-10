package com.dbs.feedback.util;

import java.util.Arrays;
import java.util.List;

public class NLPUtils {

    private static final List<String> IMPORTANT_KEYWORDS = Arrays.asList(
        "urgent", "problem", "issue", "not working", "complaint", "delay", "refund"
    );

    public static boolean isImportant(String feedback) {
        String lower = feedback.toLowerCase();
        return IMPORTANT_KEYWORDS.stream().anyMatch(lower::contains);
    }

    public static String extractMainReason(String feedback) {
        for (String keyword : IMPORTANT_KEYWORDS) {
            if (feedback.toLowerCase().contains(keyword)) return keyword;
        }
        return "General feedback";
    }
}
