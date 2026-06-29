import json
import os
from groq import Groq, APIConnectionError, RateLimitError, APIStatusError
from dotenv import load_dotenv

load_dotenv()
os.getcwd()
os.getenv("IA_EhFraude")

MODELO_PRINCIPAL = "llama-3.3-70b-versatile"
MODELO_FALLBACK = "llama-3.1-8b-instant"
MODELO = MODELO_PRINCIPAL
LIMITE_CRITICO = 85

SYSTEM_PROMPT = (
    "Você é um especialista em segurança digital e analista de ameaças cibernéticas. "
    "Sua função é analisar o texto enviado pelo usuário e identificar se ele se trata de um golpe digital, phishing ou fraude.\n\n"
    "Para definir a 'probabilidade_porcentagem' (0 a 100) de ser um GOLPE, use estritamente o seguinte critério matemático acumulativo:\n"
    "- Comece em 0%.\n"
    "- Tem link suspeito ou encurtado? (+40%)\n"
    "- Tem senso de urgência artificial ou ameaça de bloqueio? (+25%)\n"
    "- Pede ação direta (ex: responda 'NÃO', clique aqui, ligue para número)? (+20%)\n"
    "- Personifica marca famosa/banco mas usa tom genérico sem dados do cliente? (+15%)\n"
    "- Se a mensagem for puramente informativa e sem links, a probabilidade deve ficar abaixo de 30%.\n\n"
    "A sua resposta deve ser estritamente em formato JSON, seguindo exatamente esta estrutura:\n\n"
    "{\n"
    "  \"classificacao\": \"GOLPE\" ou \"SEGURO\" ou \"SUSPEITO\",\n"
    "  \"probabilidade_porcentagem\": <inteiro de 0 a 100>,\n"
    "  \"motivos\": [\"Motivo 1\", \"Motivo 2\"],\n"
    "  \"recomendacao\": \"Texto com ação recomendada ao usuário.\"\n"
    "Exemplo: uma mensagem com urgência (+25%) + ação direta (+20%) + personificação (+15%) "
    "mas SEM link suspeito deve resultar em exatamente 70%, não mais. "
    "A ausência de link é determinante para manter o score abaixo de 75%."
    "}"
)


def modelo_ia(client: Groq, texto: str, tentativas: int = 3) -> dict | None:
    for modelo in [MODELO_PRINCIPAL, MODELO_FALLBACK]:
        for tentativa in range(tentativas):
            try:
                completion = client.chat.completions.create(
                    model=modelo,
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": texto}
                    ],
                    temperature=0.9,
                    response_format={"type": "json_object"}
                )
                return json.loads(completion.choices[0].message.content)

            except RateLimitError:
                print(f"Rate limit atingido no {modelo}. Tentando próximo...")
                break 

            except APIConnectionError:
                print("Sem conexão.")
                return None

            except (APIStatusError, json.JSONDecodeError):
                print(f"Tentativa {tentativa + 1}/{tentativas} falhou no {modelo}.")
                if tentativa == tentativas - 1:
                    print(f"Esgotou tentativas no {modelo}. Tentando próximo...")

    return None


def exibir_resultado(dados: dict) -> None:
    classificacao = dados.get("classificacao", "DESCONHECIDO")
    probabilidade = dados.get("probabilidade_porcentagem", 0)
    motivos = dados.get("motivos", [])
    recomendacao = dados.get("recomendacao", "Sem recomendações.")

    print("\n--- PROCESSANDO RESULTADO ---")

    if classificacao == "GOLPE" and probabilidade >= LIMITE_CRITICO:
        print(f"ALERTA CRÍTICO: Mensagem bloqueada automaticamente ({probabilidade}% de certeza).")
    elif classificacao == "SUSPEITO" or (classificacao == "GOLPE" and probabilidade < LIMITE_CRITICO):
        print(f"AVISO: Mensagem suspeita detectada. Probabilidade: {probabilidade}%")
    else:
        print(f"✅ MENSAGEM SEGURA: Probabilidade de golpe: {probabilidade}%")

    if motivos:
        print(f"Motivos: {', '.join(motivos)}")
    print(f"Recomendação: {recomendacao}\n")


def main():
    api_key = os.getenv("IA_EhFraude")
    if not api_key:
        print("IA_EhFraude não encontrada. Configure o arquivo .env")
        return

    client = Groq(api_key=api_key)
    print("Analisador de Fraudes — Digite 'sair' para encerrar.\n")

    while True:
        texto = input("Insira a mensagem: ").strip()

        if texto.lower() in ("sair", "exit", "q"):
            print("Encerrando. Até mais!")
            break

        if not texto:
            print("Mensagem vazia. Tente novamente.\n")
            continue

        dados = modelo_ia(client, texto)
        if dados:
            exibir_resultado(dados)


if __name__ == "__main__":
    main()