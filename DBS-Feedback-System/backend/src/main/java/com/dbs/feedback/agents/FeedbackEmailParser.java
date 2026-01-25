package com.dbs.feedback.agents;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class FeedbackEmailParser {

    public static class Parsed {
        public String customerName;
        public String userName;
        public String userEmail;
        public Long productId;
        public Integer rating; // 1-5
        public String comment; // or feedback text

        public Map<String, Boolean> missing(Set<String> required) {
            Map<String, Boolean> m = new LinkedHashMap<>();
            for (String key : required) {
                boolean ok = switch (key) {
                    case "customerName" -> notBlank(customerName);
                    case "userName" -> notBlank(userName);
                    case "userEmail" -> notBlank(userEmail);
                    case "productId" -> productId != null;
                    case "rating" -> rating != null;
                    case "comment" -> notBlank(comment);
                    default -> true;
                };
                m.put(key, ok);
            }
            return m;
        }

        private boolean notBlank(String s) { return s != null && !s.trim().isEmpty(); }
    }

    private static final Pattern NAME_P = Pattern.compile("(?im)^\\s*(?:name|customer\\s*name)\\s*[:\\-=]\\s*(.+)$");
    private static final Pattern USERNAME_P = Pattern.compile("(?im)^\\s*(?:username|user\\s*name)\\s*[:\\-=]\\s*(.+)$");
    private static final Pattern EMAIL_P = Pattern.compile("(?im)^\\s*(?:email|e-?mail)\\s*[:\\-=]\\s*([A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,})$", Pattern.CASE_INSENSITIVE);
    private static final Pattern PRODUCT_P = Pattern.compile("(?im)^\\s*(?:product\\s*id|product|pid)\\s*[:\\-=]\\s*([0-9]{1,18})$");
    private static final Pattern RATING_P = Pattern.compile("(?im)^\\s*(?:rating|stars?)\\s*[:\\-=]\\s*([1-5])$");
    private static final Pattern COMMENT_P = Pattern.compile("(?is)(?:^|\\n)\\s*(?:comment|feedback|review)\\s*[:\\-=]\\s*(.+)$");

    public Parsed parse(String fromEmail, String subject, String body) {
        Parsed p = new Parsed();
        if (fromEmail != null) p.userEmail = fromEmail.toLowerCase(Locale.ROOT).trim();
        String text = body == null ? "" : body;

        Matcher m;
        if ((m = NAME_P.matcher(text)).find()) p.customerName = clean(m.group(1));
        if ((m = USERNAME_P.matcher(text)).find()) p.userName = clean(m.group(1));
        if ((m = EMAIL_P.matcher(text)).find()) p.userEmail = cleanEmail(m.group(2));
        if ((m = PRODUCT_P.matcher(text)).find()) p.productId = safeLong(m.group(1));
        if ((m = RATING_P.matcher(text)).find()) p.rating = safeInt(m.group(1));
        if ((m = COMMENT_P.matcher(text)).find()) p.comment = clean(m.group(1));

        // Heuristics: if comment not found, use entire body trimmed up to 2000 chars
        if (!notBlank(p.comment)) {
            String trimmed = text.replaceAll("(?s)<[^>]*>", "").trim();
            if (!trimmed.isEmpty()) {
                p.comment = trimmed.length() > 2000 ? trimmed.substring(0, 2000) : trimmed;
            }
        }
        return p;
    }

    public String buildMissingFieldsPrompt(Set<String> missing) {
        StringBuilder sb = new StringBuilder();
        sb.append("Thanks for your feedback! I still need a few details to submit it:\n\n");
        for (String f : missing) {
            switch (f) {
                case "customerName" -> sb.append("- Name: <your full name>\n");
                case "userName" -> sb.append("- Username: <your username>\n");
                case "userEmail" -> sb.append("- Email: <your email>\n");
                case "productId" -> sb.append("- ProductId: <numeric id>\n");
                case "rating" -> sb.append("- Rating: <1-5>\n");
                case "comment" -> sb.append("- Comment: <your review>\n");
                default -> sb.append("- ").append(f).append(": <value>\n");
            }
        }
        sb.append("\nPlease reply to this email using the following template (copy & fill):\n\n");
        sb.append("Name: <...>\n");
        sb.append("Username: <...>\n");
        sb.append("Email: <...>\n");
        sb.append("ProductId: <...>\n");
        sb.append("Rating: <1-5>\n");
        sb.append("Comment: <...>\n");
        return sb.toString();
    }

    private String clean(String s) { return s == null ? null : s.strip(); }
    private String cleanEmail(String s) { return s == null ? null : s.strip().toLowerCase(Locale.ROOT); }
    private Long safeLong(String s) { try { return Long.parseLong(s.trim()); } catch (Exception e) { return null; } }
    private Integer safeInt(String s) { try { return Integer.parseInt(s.trim()); } catch (Exception e) { return null; } }
    private boolean notBlank(String s) { return s != null && !s.trim().isEmpty(); }
}
