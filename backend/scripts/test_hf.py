from huggingface_hub import InferenceClient

HF_TOKEN = "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"
MODEL_NAME = "meta-llama/Llama-3.2-3B-Instruct"

client = InferenceClient(token=HF_TOKEN)

try:
    response = client.chat_completion(
        model=MODEL_NAME,
        messages=[{"role": "user", "content": "hi"}],
        max_tokens=10,
    )
    print(f"SUCCESS: {response.choices[0].message['content']}")
except Exception as e:
    print(f"FAILED: {e}")
