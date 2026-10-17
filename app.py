import os
import uuid
from flask import Flask, render_template, request, jsonify, session
from google import genai
import markdown
from dotenv import load_dotenv
from personas import PHILOSOPHERS, build_system_prompt

# Automatically load environment variables from .env file
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'philosopher-ai-secret-key-change-in-production')

# Support multiple API keys with failover/fallback
api_keys_env = os.environ.get('GEMINI_API_KEYS', os.environ.get('GEMINI_API_KEY', ''))
API_KEYS = [k.strip() for k in api_keys_env.split(',') if k.strip()]
current_key_index = 0

def get_genai_client():
    global current_key_index
    if not API_KEYS:
        # Fallback to default client (which checks GEMINI_API_KEY)
        return genai.Client()
    key = API_KEYS[current_key_index % len(API_KEYS)]
    return genai.Client(api_key=key)

def rotate_key():
    global current_key_index
    if API_KEYS:
        current_key_index = (current_key_index + 1) % len(API_KEYS)

@app.route('/')
def index():
    session['conversation_id'] = str(uuid.uuid4())
    session['last_interaction_id'] = None
    session['philosopher'] = 'socrates'
    session['style'] = 'ancient'
    return render_template('index.html', philosophers=PHILOSOPHERS)

@app.route('/api/philosophers')
def list_philosophers():
    return jsonify(PHILOSOPHERS)

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json() or {}
        user_message = data.get('message', '').strip()
        philosopher_key = data.get('philosopher', session.get('philosopher', 'socrates'))
        dialogue_style = data.get('style', session.get('style', 'ancient'))

        # Track choices in session
        if philosopher_key != session.get('philosopher') or dialogue_style != session.get('style'):
            session['philosopher'] = philosopher_key
            session['style'] = dialogue_style
            session['last_interaction_id'] = None  # Reset thread for new mind/cadence

        if not user_message:
            return jsonify({'error': 'Empty message'}), 400

        system_instruction = build_system_prompt(philosopher_key, dialogue_style)
        
        kwargs = {
            'model': 'gemini-3.8-flash',
            'input': user_message,
            'system_instruction': system_instruction,
            'store': True,
        }

        last_id = session.get('last_interaction_id')
        if last_id:
            kwargs['previous_interaction_id'] = last_id

        # Multi-key retry mechanism
        max_attempts = max(1, len(API_KEYS))
        interaction = None
        last_exc = None

        for attempt in range(max_attempts):
            try:
                client = get_genai_client()
                interaction = client.interactions.create(**kwargs)
                break
            except Exception as e:
                last_exc = e
                rotate_key()

        if not interaction:
            raise last_exc or Exception('Failed to communicate with the philosopher')

        session['last_interaction_id'] = interaction.id
        response_text = interaction.output_text or '...'
        response_html = markdown.markdown(response_text, extensions=['extra', 'smarty'])

        phil_info = PHILOSOPHERS.get(philosopher_key, PHILOSOPHERS['socrates'])

        return jsonify({
            'response': response_html,
            'raw': response_text,
            'philosopher': phil_info['name'],
            'avatar': phil_info['avatar']
        })

    except Exception as e:
        print(f'Error in /chat: {e}')
        return jsonify({
            'error': f'The philosopher entered silent meditation. (Error: {str(e)})'
        }), 500

@app.route('/arena/debate', methods=['POST'])
def arena_debate():
    """
    Philosophical Arena:
    Conducts a multi-turn autonomous debate or user-challenged debate between 2 or more historical philosophers.
    """
    try:
        data = request.get_json() or {}
        topic = data.get('topic', '').strip()
        phil1_key = data.get('philosopher1', 'socrates')
        phil2_key = data.get('philosopher2', 'nietzsche')
        style = data.get('style', 'ancient')
        rounds = min(int(data.get('rounds', 2)), 3)

        if not topic:
            return jsonify({'error': 'Please provide a topic or dilemma for the Arena.'}), 400

        phil1 = PHILOSOPHERS.get(phil1_key, PHILOSOPHERS['socrates'])
        phil2 = PHILOSOPHERS.get(phil2_key, PHILOSOPHERS['nietzsche'])

        debate_log = []
        transcript_context = f"Debate Topic: '{topic}'.\nDebaters: {phil1['name']} vs {phil2['name']}.\n"

        for r in range(1, rounds + 1):
            # Turn for Philosopher 1
            prompt_p1 = (
                f"{transcript_context}\n"
                f"You are {phil1['name']}. This is Round {r} of your public philosophical debate against {phil2['name']}.\n"
                f"Directly challenge their viewpoint, defend your foundational principles, and address the global contemporary context of the topic.\n"
                f"Deliver a sharp, passionate, intellectually rigorous speech (around 120-180 words)."
            )
            client = get_genai_client()
            resp1 = client.interactions.create(
                model='gemini-3.8-flash',
                input=prompt_p1,
                system_instruction=build_system_prompt(phil1_key, style),
                store=False
            )
            text1 = resp1.output_text or '...'
            debate_log.append({
                'round': r,
                'speaker': phil1['name'],
                'avatar': phil1['avatar'],
                'key': phil1_key,
                'text': markdown.markdown(text1, extensions=['extra', 'smarty']),
                'raw': text1
            })
            transcript_context += f"\n{phil1['name']}: {text1}\n"

            # Turn for Philosopher 2 responding to Philosopher 1
            prompt_p2 = (
                f"{transcript_context}\n"
                f"You are {phil2['name']}. This is Round {r}. Respond directly to what {phil1['name']} just proclaimed.\n"
                f"Dismantle their assumptions, assert your worldview, and highlight modern realities.\n"
                f"Deliver an uncompromising, authentic response (around 120-180 words)."
            )
            rotate_key()
            client = get_genai_client()
            resp2 = client.interactions.create(
                model='gemini-3.8-flash',
                input=prompt_p2,
                system_instruction=build_system_prompt(phil2_key, style),
                store=False
            )
            text2 = resp2.output_text or '...'
            debate_log.append({
                'round': r,
                'speaker': phil2['name'],
                'avatar': phil2['avatar'],
                'key': phil2_key,
                'text': markdown.markdown(text2, extensions=['extra', 'smarty']),
                'raw': text2
            })
            transcript_context += f"\n{phil2['name']}: {text2}\n"

        return jsonify({
            'topic': topic,
            'debate': debate_log
        })

    except Exception as e:
        print(f'Error in /arena/debate: {e}')
        return jsonify({'error': f'The Arena debate was interrupted: {str(e)}'}), 500

@app.route('/reset', methods=['POST'])
def reset():
    session['conversation_id'] = str(uuid.uuid4())
    session['last_interaction_id'] = None
    return jsonify({'status': 'reset'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[Philosopher AI] Server running on http://localhost:{port}")
    app.run(debug=False, host='0.0.0.0', port=port)
