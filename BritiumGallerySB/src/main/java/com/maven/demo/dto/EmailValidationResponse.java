package com.maven.demo.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonIgnoreProperties(ignoreUnknown = true)
public class EmailValidationResponse {

    @JsonProperty("is_valid_format")
    private ValidationFlag isValidFormat;

    @JsonProperty("is_mx_found")
    private ValidationFlag isMxFound;

    @JsonProperty("is_smtp_valid")
    private ValidationFlag isSmtpValid;

    // Optional: more fields like is_disposable_email etc. can be added similarly

    public ValidationFlag getIsValidFormat() {
        return isValidFormat;
    }

    public void setIsValidFormat(ValidationFlag isValidFormat) {
        this.isValidFormat = isValidFormat;
    }

    public ValidationFlag getIsMxFound() {
        return isMxFound;
    }

    public void setIsMxFound(ValidationFlag isMxFound) {
        this.isMxFound = isMxFound;
    }

    public ValidationFlag getIsSmtpValid() {
        return isSmtpValid;
    }

    public void setIsSmtpValid(ValidationFlag isSmtpValid) {
        this.isSmtpValid = isSmtpValid;
    }

    public static class ValidationFlag {
        private boolean value;
        private String text;

        public boolean isValue() {
            return value;
        }

        public void setValue(boolean value) {
            this.value = value;
        }

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }
    }

    @Override
    public String toString() {
        return "EmailValidationResponse{" +
                "isValidFormat=" + isValidFormat +
                ", isMxFound=" + isMxFound +
                ", isSmtpValid=" + isSmtpValid +
                '}';
    }
}
