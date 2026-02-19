package com.example.backend_main.dto;

import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ChatMessageDTO {
    private String roomId;
    private Long senderNo;
    private String message;
    private String msgType;
    private String fileUrl;
}