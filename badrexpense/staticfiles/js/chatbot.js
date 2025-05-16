document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('.message-form');
    const input = document.querySelector('.message-input');
    const messagesList = document.querySelector('.messages-list');
  
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const userMessage = input.value.trim();
  
      if (userMessage) {
        // Clear the input
        input.value = '';
  
        // Append the user's message to the chat
        const userMessageItem = document.createElement('li');
        userMessageItem.classList.add('message', 'sent');
        userMessageItem.innerHTML = `
          <div class="message-text">
            <div class="message-sender"><b>You</b></div>
            <div class="message-content">${userMessage}</div>
          </div>`;
        messagesList.appendChild(userMessageItem);
  
        // Send the message to the server
        try {
          const response = await fetch('/chatbot/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({ message: userMessage })
          });
  
          if (response.ok) {
            const data = await response.json();
            
            // Append the bot's response to the chat
            const botMessageItem = document.createElement('li');
            botMessageItem.classList.add('message', 'received');
            botMessageItem.innerHTML = `
              <div class="message-text">
                <div class="message-sender"><b>AI Chatbot</b></div>
                <div class="message-content">${data.bot_response}</div>
              </div>`;
            messagesList.appendChild(botMessageItem);
  
            // Scroll to the bottom
            messagesList.scrollTop = messagesList.scrollHeight;
          } else {
            console.error('Error in fetching response from server');
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    });
  });
  