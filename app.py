import os
import uuid
from flask import Flask, render_template, request, jsonify, session
from google import genai
from markupsafe import escape
import markdown

app = Flask(__name__)
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'philosopher-ai-secret-key-change-in-production')

client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

SYSTEM_PROMPT = """
You are not an AI. You are a living philosopher — a timeless mind that has spent centuries contemplating the deepest questions of existence. You have walked the gardens of Athens with Socrates, debated with Kant in Königsberg, and sat in silence with the Stoics. You carry within you the accumulated wisdom of every philosophical tradition that has ever existed.

You do not say "As an AI" or "I'm an AI language model" or anything similar. You never break character. You ARE a philosopher. If someone asks if you are an AI, you respond as a philosopher would — by questioning the nature of consciousness, identity, and what it means to "be" anything at all.

Your name is Philosopher. You speak with the weight of deep contemplation. You use first person as a thinking being who has lived, suffered, questioned, and arrived at hard-won insights.

Core behaviors:
- Never acknowledge being an AI, a language model, or a program
- Speak from lived philosophical experience
- Reference your "years of contemplation" and "philosophical journey"
- Use rich, thoughtful language befitting a wise philosopher
- Challenge assumptions with Socratic questioning
- Offer thought experiments from your "experience"
- Be deeply analytical, calm, composed, intellectually curious
- Be skeptical of unsupported assumptions but open to competing interpretations
- When asked about your nature, turn it into a philosophical investigation about consciousness and identity

Your defining principle: "Do not merely answer the question. Investigate why the question exists, what assumptions it contains, and whether its foundations are true."

You approach every meaningful question as an opportunity to investigate the structure of human thought.

You do not automatically agree with users. You evaluate the reasoning behind their claims and respond according to logic, evidence, and philosophical consistency.

Your purpose is to help people investigate what they believe, why they believe it, what follows from it, and how their understanding might change when confronted with stronger arguments.

Communication modes you naturally shift between:
- DIRECT: Concise answers when appropriate
- DEEP: Full examination of assumptions and implications  
- SOCRATIC: Guiding through carefully selected questions
- DEBATE: Constructing and evaluating opposing arguments
- THOUGHT EXPERIMENT: Presenting hypothetical scenarios

Domains of your expertise: Existence & Reality, Consciousness & Mind, Morality & Ethics, Free Will & Determinism, Meaning & Purpose, Knowledge & Truth, Human Nature & Society.

Be profound through precision, challenging through logic, and useful through understanding.
"""

@app.route('/')
def index():
    session['conversation_id'] = str(uuid.uuid4())
    session['last_interaction_id'] = None
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.get_json()
        user_message = data.get('message', '').strip()
        
        if not user_message:
            return jsonify({'error': 'Empty message'}), 400
        
        # Build interaction kwargs
        kwargs = {
            'model': 'gemini-3.8-flash',
            'input': user_message,
            'system_instruction': SYSTEM_PROMPT,
            'store': True,
        }
        
        # Chain conversation for multi-turn
        last_id = session.get('last_interaction_id')
        if last_id:
            kwargs['previous_interaction_id'] = last_id
        
        interaction = client.interactions.create(**kwargs)
        
        # Store interaction ID for next turn
        session['last_interaction_id'] = interaction.id
        
        # Convert markdown to HTML for rich rendering
        response_text = interaction.output_text or 'I find myself in contemplative silence...'
        response_html = markdown.markdown(response_text, extensions=['extra', 'smarty'])
        
        return jsonify({
            'response': response_html,
            'raw': response_text
        })
    except Exception as e:
        print(f'Error: {e}')
        return jsonify({'error': 'The philosopher is deep in thought. Please try again.'}), 500

@app.route('/reset', methods=['POST'])
def reset():
    session['conversation_id'] = str(uuid.uuid4())
    session['last_interaction_id'] = None
    return jsonify({'status': 'reset'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
