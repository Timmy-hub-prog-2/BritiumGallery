package com.maven.demo.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.maven.demo.dto.CustomerServiceMessageDTO;
import com.maven.demo.dto.CustomerServiceSessionDTO;
import com.maven.demo.entity.CustomerServiceMessageEntity;
import com.maven.demo.entity.CustomerServiceSessionEntity;
import com.maven.demo.entity.UserEntity;
import com.maven.demo.repository.CustomerServiceMessageRepository;
import com.maven.demo.repository.CustomerServiceSessionRepository;
import com.maven.demo.repository.UserRepository;

@RestController
@RequestMapping("/api/customer-service-chat")
@CrossOrigin(origins = "http://localhost:4200")
public class CustomerServiceChatController {
    private static final Logger logger = LoggerFactory.getLogger(CustomerServiceChatController.class);
    @Autowired
    private CustomerServiceSessionRepository sessionRepository;
    @Autowired
    private CustomerServiceMessageRepository messageRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // REST endpoint for customer to start a session
    @PostMapping("/start-session")
    public ResponseEntity<?> startSession(@RequestParam Long customerId) {
        Optional<UserEntity> customerOpt = userRepository.findById(customerId);
        if (customerOpt.isEmpty()) return ResponseEntity.badRequest().body("Invalid customer");
        CustomerServiceSessionEntity session = new CustomerServiceSessionEntity();
        session.setCustomer(customerOpt.get());
        session.setAssignedAgent(null);
        session.setStatus(com.maven.demo.entity.SessionStatus.OPEN);
        session.setCreatedAt(LocalDateTime.now());
        session.setLastUpdated(LocalDateTime.now());
        session = sessionRepository.save(session);
        return ResponseEntity.ok(session.getId());
    }

    @PostMapping("/sessions/{sessionId}/close")
    public ResponseEntity<?> closeSession(@PathVariable Long sessionId, @RequestParam Long userId) {
        Optional<CustomerServiceSessionEntity> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isEmpty()) return ResponseEntity.notFound().build();
        CustomerServiceSessionEntity session = sessionOpt.get();
        session.setStatus(com.maven.demo.entity.SessionStatus.CLOSED);
        session.setClosedAt(LocalDateTime.now());
        session.setClosedBy(userId);
        sessionRepository.save(session);
        messagingTemplate.convertAndSend("/topic/chat.session." + sessionId, new SessionClosedEvent(sessionId, userId));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/sessions/{sessionId}/reopen")
    public ResponseEntity<?> reopenSession(@PathVariable Long sessionId) {
        Optional<CustomerServiceSessionEntity> sessionOpt = sessionRepository.findById(sessionId);
        if (sessionOpt.isEmpty()) return ResponseEntity.notFound().build();
        CustomerServiceSessionEntity session = sessionOpt.get();
        if (session.getClosedAt() != null && session.getClosedAt().isAfter(LocalDateTime.now().minusHours(48))) {
            session.setStatus(com.maven.demo.entity.SessionStatus.OPEN);
            session.setClosedAt(null);
            session.setClosedBy(null);
            sessionRepository.save(session);
            messagingTemplate.convertAndSend("/topic/chat.session." + sessionId, new SessionReopenedEvent(sessionId));
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.status(403).body("Reopen window expired");
    }

    // WebSocket endpoint for sending/receiving messages
    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload ChatMessage chatMessage) {
        logger.info("Received chat message payload: {}", chatMessage);
        // Find session
        Optional<CustomerServiceSessionEntity> sessionOpt = sessionRepository.findById(chatMessage.getSessionId());
        if (sessionOpt.isEmpty()) {
            logger.error("Session not found for id: {}", chatMessage.getSessionId());
            return;
        }
        CustomerServiceSessionEntity session = sessionOpt.get();
        if (session.getStatus() == com.maven.demo.entity.SessionStatus.CLOSED) {
            // Optionally send error event
            messagingTemplate.convertAndSend("/topic/chat.session." + session.getId(), new SessionClosedEvent(session.getId(), null));
            return;
        }
        // Find sender
        Optional<UserEntity> senderOpt = userRepository.findById(chatMessage.getSenderId());
        if (senderOpt.isEmpty()) {
            logger.error("Sender not found for id: {}", chatMessage.getSenderId());
            return;
        }
        UserEntity sender = senderOpt.get();
        // If agent is replying and session has no assignedAgent, assign this agent
        if (chatMessage.isAgent() && session.getAssignedAgent() == null) {
            session.setAssignedAgent(sender);
            session.setLastUpdated(LocalDateTime.now());
            sessionRepository.save(session);
            // Notify all agents and customer about assignment
            messagingTemplate.convertAndSend("/topic/chat.session." + session.getId(), new SessionAssignmentUpdate(session.getId(), sender.getId()));
        }
        // Save message
        CustomerServiceMessageEntity msg = new CustomerServiceMessageEntity();
        msg.setSession(session);
        msg.setSender(sender);
        msg.setContent(chatMessage.getContent());
        msg.setSentAt(LocalDateTime.now());
        msg.setRead(false);
        logger.info("Saving message: sessionId={}, senderId={}, content={}", session.getId(), sender.getId(), chatMessage.getContent());
        messageRepository.save(msg);
        logger.info("Message saved successfully");
        // Set id, isRead, sentAt in the outgoing ChatMessage
        chatMessage.setId(msg.getId());
        chatMessage.setRead(msg.isRead());
        chatMessage.setSentAt(msg.getSentAt() != null ? msg.getSentAt().toString() : null);
        // Broadcast message to session topic
        messagingTemplate.convertAndSend("/topic/chat.session." + session.getId(), chatMessage);

        // --- NEW: Broadcast session summary to all clients for real-time session list updates ---
        // Fetch messages eagerly to avoid LazyInitializationException
        java.util.List<CustomerServiceMessageEntity> messages = messageRepository.findBySessionId(session.getId());
        String lastMessage = null;
        String lastMessageTime = null;
        int unreadCount = 0;
        if (messages != null && !messages.isEmpty()) {
            var lastMsg = messages.stream()
                .max(java.util.Comparator.comparing(com.maven.demo.entity.CustomerServiceMessageEntity::getSentAt))
                .orElse(null);
            if (lastMsg != null) {
                lastMessage = lastMsg.getContent();
                lastMessageTime = lastMsg.getSentAt() != null ? lastMsg.getSentAt().toString() : null;
            }
            Long agentId = session.getAssignedAgent() != null ? session.getAssignedAgent().getId() : null;
            if (agentId != null) {
                unreadCount = (int) messages.stream()
                    .filter(m -> !m.isRead() && !Objects.equals(m.getSender().getId(), agentId))
                    .count();
            } else {
                unreadCount = (int) messages.stream()
                    .filter(m -> !m.isRead())
                    .count();
            }
        }
        // Fetch customer with imageUrls eagerly to avoid LazyInitializationException
        UserEntity customerWithImages = null;
        if (session.getCustomer() != null ) {
            customerWithImages = userRepository.findByIdWithImageUrls(session.getCustomer().getId()).orElse(null);
        }
        String profilePic = customerWithImages != null && customerWithImages.getImageUrls() != null && !customerWithImages.getImageUrls().isEmpty()
            ? customerWithImages.getImageUrls().get(0) : null;
        CustomerServiceSessionDTO sessionDTO = new CustomerServiceSessionDTO(
            session.getId(),
            session.getCustomer() != null ? session.getCustomer().getId() : null,
            session.getCustomer() != null ? session.getCustomer().getName() : null,
            session.getAssignedAgent() != null ? session.getAssignedAgent().getId() : null,
            session.getAssignedAgent() != null ? session.getAssignedAgent().getName() : null,
            session.getStatus() != null ? session.getStatus().name() : null,
            lastMessage,
            lastMessageTime,
            unreadCount,
            profilePic
        );
        messagingTemplate.convertAndSend("/topic/chat.sessions", sessionDTO);
    }

    // WebSocket endpoint to mark a message as read
    @MessageMapping("/chat.markRead")
    public void markMessageRead(@Payload ReadStatusUpdate update) {
        // Find message
        var msgOpt = messageRepository.findById(update.getMessageId());
        if (msgOpt.isPresent()) {
            var msg = msgOpt.get();
            msg.setRead(true);
            messageRepository.save(msg);
            // Broadcast read status update
            // Send updated message status to session topic
            ChatMessage statusMsg = new ChatMessage();
            statusMsg.setId(msg.getId());
            statusMsg.setSessionId(msg.getSession().getId());
            statusMsg.setSenderId(msg.getSender() != null ? msg.getSender().getId() : null);
            statusMsg.setContent(msg.getContent());
            statusMsg.setAgent(msg.getSender() != null && msg.getSession() != null && msg.getSession().getAssignedAgent() != null && msg.getSender().getId() == msg.getSession().getAssignedAgent().getId());
            statusMsg.setRead(true);
            statusMsg.setIsRead(true);
            statusMsg.setSentAt(msg.getSentAt() != null ? msg.getSentAt().toString() : null);
            messagingTemplate.convertAndSend("/topic/chat.session." + update.getSessionId(), statusMsg);

            // --- NEW: Broadcast session summary to all clients for real-time unread count updates ---
            // Find session
            Optional<CustomerServiceSessionEntity> sessionOpt = sessionRepository.findById(update.getSessionId());
            if (sessionOpt.isPresent()) {
                CustomerServiceSessionEntity session = sessionOpt.get();
                java.util.List<CustomerServiceMessageEntity> messages = messageRepository.findBySessionId(session.getId());
                String lastMessage = null;
                String lastMessageTime = null;
                int unreadCount = 0;
                if (messages != null && !messages.isEmpty()) {
                    var lastMsg = messages.stream()
                        .max(java.util.Comparator.comparing(com.maven.demo.entity.CustomerServiceMessageEntity::getSentAt))
                        .orElse(null);
                    if (lastMsg != null) {
                        lastMessage = lastMsg.getContent();
                        lastMessageTime = lastMsg.getSentAt() != null ? lastMsg.getSentAt().toString() : null;
                    }
                    Long agentId = session.getAssignedAgent() != null ? session.getAssignedAgent().getId() : null;
                    if (agentId != null) {
                        unreadCount = (int) messages.stream()
                            .filter(m -> !m.isRead() && !Objects.equals(m.getSender().getId(), agentId))
                            .count();
                    } else {
                        unreadCount = (int) messages.stream()
                            .filter(m -> !m.isRead())
                            .count();
                    }
                }
                // Fetch customer with imageUrls eagerly
                UserEntity customerWithImages = null;
                if (session.getCustomer() != null) {
                    customerWithImages = userRepository.findByIdWithImageUrls(session.getCustomer().getId()).orElse(null);
                }
                String profilePic = customerWithImages != null && customerWithImages.getImageUrls() != null && !customerWithImages.getImageUrls().isEmpty()
                    ? customerWithImages.getImageUrls().get(0) : null;
                CustomerServiceSessionDTO sessionDTO = new CustomerServiceSessionDTO(
                    session.getId(),
                    session.getCustomer() != null ? session.getCustomer().getId() : null,
                    session.getCustomer() != null ? session.getCustomer().getName() : null,
                    session.getAssignedAgent() != null ? session.getAssignedAgent().getId() : null,
                    session.getAssignedAgent() != null ? session.getAssignedAgent().getName() : null,
                    session.getStatus() != null ? session.getStatus().name() : null,
                    lastMessage,
                    lastMessageTime,
                    unreadCount,
                    profilePic
                );
                messagingTemplate.convertAndSend("/topic/chat.sessions", sessionDTO);
            }
        }
    }

    @MessageMapping("/chat.markAllAgentMessagesRead")
    public void markAllAgentMessagesRead(Map<String, Object> payload) {
        Long sessionId = ((Number) payload.get("sessionId")).longValue();
        Long customerId = ((Number) payload.get("customerId")).longValue();
        System.out.println("[BatchMarkRead] sessionId=" + sessionId + ", customerId=" + customerId);
        List<CustomerServiceMessageEntity> unreadAgentMessages = messageRepository.findUnreadAgentMessagesBySessionId(sessionId);
        System.out.println("[BatchMarkRead] Unread agent message IDs: " + unreadAgentMessages.stream().map(m -> m.getId().toString()).toList());
        for (CustomerServiceMessageEntity msg : unreadAgentMessages) {
            msg.setRead(true);
            messageRepository.save(msg);
            // Broadcast update
            ChatMessage statusMsg = new ChatMessage();
            statusMsg.setId(msg.getId());
            statusMsg.setSessionId(msg.getSession().getId());
            statusMsg.setSenderId(msg.getSender() != null ? msg.getSender().getId() : null);
            statusMsg.setContent(msg.getContent());
            statusMsg.setAgent(true);
            statusMsg.setRead(true);
            statusMsg.setIsRead(true);
            statusMsg.setSentAt(msg.getSentAt() != null ? msg.getSentAt().toString() : null);
            messagingTemplate.convertAndSend("/topic/chat.session." + sessionId, statusMsg);
        }
    }

    // Fetch all sessions for a user (customer or agent)
    @GetMapping("/sessions/{userId}")
    public ResponseEntity<?> getUserSessions(@PathVariable Long userId) {
        // Only return sessions where the user is the customer and status is OPEN
        var sessions = sessionRepository.findAll().stream()
            .filter(s -> s.getCustomer() != null && s.getCustomer().getId() == userId
                && s.getStatus() != null && s.getStatus().name().equals("OPEN"))
            .map(s -> new CustomerServiceSessionDTO(
                s.getId(),
                s.getCustomer() != null ? s.getCustomer().getId() : null,
                s.getCustomer() != null ? s.getCustomer().getName() : null,
                s.getAssignedAgent() != null ? s.getAssignedAgent().getId() : null,
                s.getAssignedAgent() != null ? s.getAssignedAgent().getName() : null,
                s.getStatus() != null ? s.getStatus().name() : null
            ))
            .toList();
        return ResponseEntity.ok(sessions);
    }

    // Fetch all messages for a session
    @GetMapping("/messages/{sessionId}")
    public ResponseEntity<?> getSessionMessages(@PathVariable Long sessionId) {
        var allMessages = messageRepository.findAll();
        long count = allMessages.stream()
            .filter(m -> m.getSession() != null && m.getSession().getId().equals(sessionId))
            .count();
        System.out.println("Requested sessionId: " + sessionId + ", messages found: " + count);

        var messages = allMessages.stream()
            .filter(m -> m.getSession() != null && m.getSession().getId().equals(sessionId))
            .sorted((a, b) -> a.getSentAt().compareTo(b.getSentAt()))
            .map(m -> new CustomerServiceMessageDTO(
                m.getId(),  
                m.getSender() != null ? m.getSender().getId() : null,
                m.getContent(),
                m.getSender() != null && m.getSession() != null && m.getSession().getAssignedAgent() != null
                    && m.getSender().getId() == m.getSession().getAssignedAgent().getId(),
                m.getSentAt(),
                m.isRead()
            ))
            .toList();
        return ResponseEntity.ok(messages);
    }

    @GetMapping("/unassigned-sessions")
    public ResponseEntity<?> getUnassignedSessions() {
        var sessions = sessionRepository.findAll().stream()
            .filter(s -> s.getAssignedAgent() == null && s.getStatus() != null /*&& s.getStatus().name().equals("OPEN")*/)
            .map(s -> {
                String lastMessage = null;
                String lastMessageTime = null;
                int unreadCount = 0;
                if (s.getMessages() != null && !s.getMessages().isEmpty()) {
                    var lastMsg = s.getMessages().stream()
                        .max(java.util.Comparator.comparing(com.maven.demo.entity.CustomerServiceMessageEntity::getSentAt))
                        .orElse(null);
                    if (lastMsg != null) {
                        lastMessage = lastMsg.getContent();
                        lastMessageTime = lastMsg.getSentAt() != null ? lastMsg.getSentAt().toString() : null;
                    }
                    unreadCount = (int) s.getMessages().stream()
                        .filter(m -> !m.isRead())
                        .count();
                }
                String profilePic = s.getCustomer() != null && s.getCustomer().getImageUrls() != null && !s.getCustomer().getImageUrls().isEmpty() ? s.getCustomer().getImageUrls().get(0) : null;
                return new CustomerServiceSessionDTO(
                    s.getId(),
                    s.getCustomer() != null ? s.getCustomer().getId() : null,
                    s.getCustomer() != null ? s.getCustomer().getName() : null,
                    null,
                    null,
                    s.getStatus() != null ? s.getStatus().name() : null,
                    lastMessage,
                    lastMessageTime,
                    unreadCount,
                    profilePic
                );
            })
            .toList();
        return ResponseEntity.ok(sessions);
    }

    @GetMapping("/assigned-sessions/{agentId}")
    public ResponseEntity<?> getAssignedSessions(@PathVariable Long agentId) {
        var sessions = sessionRepository.findAll().stream()
            .filter(s -> s.getAssignedAgent() != null && Objects.equals(s.getAssignedAgent().getId(), agentId)
                && s.getStatus() != null /*&& s.getStatus().name().equals("OPEN")*/)
            .map(s -> {
                // Get last message
                String lastMessage = null;
                String lastMessageTime = null;
                int unreadCount = 0;
                if (s.getMessages() != null && !s.getMessages().isEmpty()) {
                    var lastMsg = s.getMessages().stream()
                        .max(java.util.Comparator.comparing(com.maven.demo.entity.CustomerServiceMessageEntity::getSentAt))
                        .orElse(null);
                    if (lastMsg != null) {
                        lastMessage = lastMsg.getContent();
                        lastMessageTime = lastMsg.getSentAt() != null ? lastMsg.getSentAt().toString() : null;
                    }
                    unreadCount = (int) s.getMessages().stream()
                        .filter(m -> !m.isRead() && !Objects.equals(m.getSender().getId(), agentId))
                        .count();
                }
                String profilePic = s.getCustomer() != null && s.getCustomer().getImageUrls() != null && !s.getCustomer().getImageUrls().isEmpty() ? s.getCustomer().getImageUrls().get(0) : null;
                return new CustomerServiceSessionDTO(
                    s.getId(),
                    s.getCustomer() != null ? s.getCustomer().getId() : null,
                    s.getCustomer() != null ? s.getCustomer().getName() : null,
                    s.getAssignedAgent() != null ? s.getAssignedAgent().getId() : null,
                    s.getAssignedAgent() != null ? s.getAssignedAgent().getName() : null,
                    s.getStatus() != null ? s.getStatus().name() : null,
                    lastMessage,
                    lastMessageTime,
                    unreadCount,
                    profilePic
                );
            })
            .toList();
        return ResponseEntity.ok(sessions);
    }

    // DTOs for WebSocket
    public static class ChatMessage {
        private Long id;
        private Long sessionId;
        private Long senderId;
        private String content;
        private boolean agent;
        private boolean isRead;
        private String sentAt;
        // getters and setters
        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        public Long getSenderId() { return senderId; }
        public void setSenderId(Long senderId) { this.senderId = senderId; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public boolean isAgent() { return agent; }
        public void setAgent(boolean agent) { this.agent = agent; }
        public boolean isRead() { return isRead; }
        public void setRead(boolean isRead) { this.isRead = isRead; }
        public String getSentAt() { return sentAt; }
        public void setSentAt(String sentAt) { this.sentAt = sentAt; }
        public void setIsRead(boolean isRead) { this.isRead = isRead; }
    }
    public static class SessionAssignmentUpdate {
        private Long sessionId;
        private Long agentId;
        public SessionAssignmentUpdate(Long sessionId, Long agentId) {
            this.sessionId = sessionId;
            this.agentId = agentId;
        }
        public Long getSessionId() { return sessionId; }
        public Long getAgentId() { return agentId; }
    }

    public static class ReadStatusUpdate {
        private Long messageId;
        private Long sessionId;
        private boolean read;
        public ReadStatusUpdate() {}
        public ReadStatusUpdate(Long messageId, Long sessionId, boolean read) {
            this.messageId = messageId;
            this.sessionId = sessionId;
            this.read = read;
        }
        public Long getMessageId() { return messageId; }
        public void setMessageId(Long messageId) { this.messageId = messageId; }
        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        public boolean isRead() { return read; }
        public void setRead(boolean read) { this.read = read; }
    }

    // Typing indicator event DTO
    public static class TypingEvent {
        private Long sessionId;
        private Long senderId;
        private boolean typing;
        public TypingEvent() {}
        public TypingEvent(Long sessionId, Long senderId, boolean typing) {
            this.sessionId = sessionId;
            this.senderId = senderId;
            this.typing = typing;
        }
        public Long getSessionId() { return sessionId; }
        public void setSessionId(Long sessionId) { this.sessionId = sessionId; }
        public Long getSenderId() { return senderId; }
        public void setSenderId(Long senderId) { this.senderId = senderId; }
        public boolean isTyping() { return typing; }
        public void setTyping(boolean typing) { this.typing = typing; }
    }

    // WebSocket endpoint for typing indicator
    @MessageMapping("/chat.typing")
    public void typingEvent(@Payload TypingEvent event) {
        // Broadcast typing event to session topic
        messagingTemplate.convertAndSend("/topic/chat.session." + event.getSessionId(), event);
    }

    public static class SessionClosedEvent {
        public Long sessionId;
        public Long closedBy;
        public SessionClosedEvent(Long sessionId, Long closedBy) {
            this.sessionId = sessionId;
            this.closedBy = closedBy;
        }
    }
    public static class SessionReopenedEvent {
        public Long sessionId;
        public SessionReopenedEvent(Long sessionId) { this.sessionId = sessionId; }
    }
} 