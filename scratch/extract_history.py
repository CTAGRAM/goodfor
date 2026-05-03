
import json
import sys
import re

input_file = '/Users/rudra/.gemini/antigravity/brain/6e5d2687-705b-4c77-9e94-058bb56098e7/.system_generated/logs/overview.txt'
output_file = '/Users/rudra/Downloads/create-anything/apps/mobile/history.md'

with open(input_file, 'r') as f:
    lines = f.readlines()

history = "# Chat Conversation History\n\n"

for line in lines:
    try:
        data = json.loads(line)
        source = data.get('source')
        msg_type = data.get('type')
        content = data.get('content', '')
        
        if msg_type == 'USER_INPUT':
            # Extract request from <USER_REQUEST> tags if present
            request_match = re.search(r'<USER_REQUEST>(.*?)</USER_REQUEST>', content, re.DOTALL)
            if request_match:
                content = request_match.group(1).strip()
            
            history += f"### User\n\n{content}\n\n"
        
        elif msg_type == 'PLANNER_RESPONSE' and content:
            history += f"### Assistant\n\n{content}\n\n"
            
        elif msg_type == 'PLANNER_RESPONSE' and data.get('tool_calls'):
            # Optionally log tool calls
            tool_names = [tc.get('name') for tc in data.get('tool_calls')]
            history += f"*Assistant used tools: {', '.join(tool_names)}*\n\n"

    except Exception as e:
        continue

with open(output_file, 'w') as f:
    f.write(history)
