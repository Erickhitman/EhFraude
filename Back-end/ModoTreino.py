import json
import os
import random
import time
from groq import Groq, APIConnectionError, RateLimitError, APIStatusError
from dotenv import load_dotenv

load_dotenv()
os.getcwd()
os.getenv("IA_EhFraude")

MODELO_PRINCIPAL = "llama-3.3-70b-versatile"
MODELO_FALLBACK = "llama-3.1-8b-instant"
MODELO = MODELO_PRINCIPAL
LIMITE_CRITICO = 85

EXEMPLOS_REAIS = (
    "Abaixo estão exemplos reais de golpes para você se basear no estilo, tom e estrutura. "
    "Nunca copie esses textos — use-os apenas como referência de como golpistas escrevem:\n\n"

    "EXEMPLO 1 (SMS/Correios):\n"
    "'CORREIOS: Rute, Seu pacote foi taxado e aguarda sua retirada. "
    "Para saber mais, acesse: http://entregaexpress-live.org'\n\n"

    "EXEMPLO 2 (SMS/Seguridade Social):\n"
    "'Caro contribuinte tem um pagamento em atraso evite e pague ate 24/02. "
    "Mais detalhes em: https://pt.seg-social.at/062915847'\n\n"

    "EXEMPLO 3 (SMS/Banco):\n"
    "'BB: Debito agendado para esta data no canal Celular. "
    "Responda com suas senhas para cancelar.'\n\n"

    "EXEMPLO 4 (WhatsApp/Falso Oficial de Justiça):\n"
    "'Boa tarde Sr., me chamo Marcos sou oficial de justiça. "
    "A perícia técnica junto com o juiz determinou que você recebe um valor de R$56.930,00. "
    "A decisão foi proferida em última instância. Me envie os dados da conta para depósito em sua titularidade.'\n\n"

    "EXEMPLO 5 (SMS/Pix Falso):\n"
    "'BRADESCO: Agendamento PIX no valor de 4.550,00 realizado com sucesso. "
    "Caso nao reconheca ligue imediatamente para 0800 400 8045'\n\n"

    "EXEMPLO 6 (WhatsApp/Atualização Falsa):\n"
    "'Você recebeu uma mensagem, mas sua versão do WhatsApp não é compatível. "
    "Atualizar o WhatsApp: [link]'\n\n"

    "EXEMPLO 7 (WhatsApp/Sindicato Falso):\n"
    "'COMUNICADO URGENTE — SINDICATO DOS TRABALHADORES DAS INSTITUIÇÕES FEDERAIS DE ENSINO: "
    "DE MATO GROSSO DO SUL CUMPRIMENTO DE SENTENÇA CONTRA A UNIÃO FEDERAL AGU.'\n\n"

    "EXEMPLO 8 (SMS/Bolsa Família):\n"
    "'Bolsa-Familia informa: Dados desatualizados, atualize e evite suspensao do programa social brasil-att.com'\n\n"

    "EXEMPLO 9 (SMS/CRAS):\n"
    "'ALERTA C R A S: Dados Desatualizados, atualize agora e evite perde seu beneflcio PRAZO 19/03/2024 bit.ly/cadattt'\n\n"

    "EXEMPLO 10 (WhatsApp/Falso Advogado):\n"
    "'Bom dia Thiago, tudo bem? Ganhamos a sua causa, assim que possível me retorne por gentileza. "
    "O promotor responsável pela sua liberação vai entrar em contato para finalizar. "
    "Quando você finalizar a ligação com o promotor o valor já estará na sua conta.'\n\n"

    "EXEMPLO 11 (WhatsApp/Golpe do Filho):\n"
    "'Oi pai troquei de número salva esse contato. Pai preciso de um favor, "
    "eu tenho que pagar uma conta hoje e meu aplicativo do banco está pedindo pra trocar a assinatura eletrônica. "
    "Consegue me emprestar o dinheiro? Amanhã te repasso. O valor é 1645 reais, tens esse valor?'\n\n"

    "EXEMPLO 12 (WhatsApp/Golpe do Pagamento):\n"
    "'Preciso fazer um pagamento agora e meus aplicativos estão tudo no outro aparelho. "
    "Pode fazer pra mim? À tarde já te mando de volta.'\n\n"

    "EXEMPLO 13 (WhatsApp/Golpe do Limite):\n"
    "'Aplicativo bancário você usa? Fiquei de fazer um pagamento mas excedeu meu limite de transferência, "
    "consegue fazer pra mim e amanhã cedo te transfiro de volta?'\n\n"

    "EXEMPLO 14 (WhatsApp/Emprego Falso):\n"
    "'Olá, sou o gerente geral do projeto Am e atualmente estou recrutando uma equipe de meio período. "
    "Você pode trabalhar meio período no seu telefone. Um trabalho de meio período leva 10 a 20 minutos! "
    "Os recém-chegados ganham imediatamente 50 reais. Salário diário: 500-1500 reais. "
    "Este trabalho exige que você tenha pelo menos 20 anos de idade.'\n\n"

    "EXEMPLO 15 (WhatsApp/Golpe do Neto):\n"
    "'Oi, Vô. Tudo bem? Aqui é o Felipe, seu neto. Troquei de celular, pode salvar esse número? "
    "Vô, ainda estou sem acesso às minhas contas bancárias no meu celular novo. "
    "A senhora pode fazer um pix pra mim? Estou sem meu cartão aqui comigo.'\n\n"
    
    "EXEMPLO 16 (E-mail/Banco Itaú):\n"
    "'Prezado cliente Itaú, Nosso sistema de segurança identificou um problema de dessincronização "
    "com seu dispositivo de segurança (iToken). Para sua conveniência disponibilizamos o procedimento "
    "de sincronização. Por questões de segurança se torna obrigatória a realização deste procedimento "
    "em até 72 horas, caso não realizado seu acesso será suspenso. "
    "Conforme regulamento a taxa de R$54,50 será cobrada para envio de um novo dispositivo.'\n\n"

    "EXEMPLO 17 (E-mail/Pontos Falsos):\n"
    "'Prezado Cliente, Você tem pontos acumulados disponíveis para resgate que estao bem próximos "
    "de expirar, você cliente Banco Bradesco tem pontos em dobro. "
    "Acesse sua conta para Resgatar seus PONTOS LIVELO BRADESCO. Pontos expiram em: 24/01/2023.'\n\n"

    "EXEMPLO 18 (E-mail/PayPal Falso):\n"
    "'Dear Customer Service, Your Paypal account has been limited because we noticed significant "
    "changes in your account activity. This account limitation will affect your ability to send or "
    "receive money, withdraw money, add or remove a card. Please Log In to your PayPal account "
    "and provide the requested information through the Resolution Center.'\n\n"

    "EXEMPLO 19 (E-mail/Extorsão com Bitcoin):\n"
    "'Olá. Fui infectado ao malware proveniente de um site adulto que você visitou. "
    "Tenho um vídeo seu que posso enviar a todos os seus contatos e redes sociais. "
    "Para evitar isso transfira Bitcoin no valor de $503 para minha carteira: [endereço Bitcoin]. "
    "Tem 2 dias para completar esta transação. Não tente me responder, meu contato é anônimo.'\n\n"

    "EXEMPLO 20 (E-mail/Extorsão com Vírus):\n"
    "'Este é o final notificação. Eu configurei vírus no seu computador que visita sites adultos. "
    "Tenho entrada para seu próprio pessoal info, mensageiros instantâneos, redes sociais, e-mail. "
    "Meu virus é um ajustável-sistema malware com substituído VNC. "
    "Eu já fiz gravação de video clipe com pornografia a qual você foram visualizando. "
    "Vou expor tudo ao público geral se não pagar.'\n\n"

    "Use o estilo desses exemplos para criar desafios realistas e convincentes, "
    "respeitando os padrões de linguagem, urgência e links suspeitos encontrados nesses casos reais.\n\n"
)

SYSTEM_PROMPT = EXEMPLOS_REAIS + (
    "Você é um especialista em segurança digital, golpes virtuais e educação cibernética. "
    "Sua função é criar desafios educativos para treinar usuários a identificar fraudes digitais.\n\n"

    "Os desafios devem ser variados e realistas, baseados em situações comuns: phishing, golpes via Pix, "
    "falsos boletos, promoções falsas, golpes de WhatsApp, falsas centrais bancárias, redes sociais e e-mails maliciosos. "
    "As mensagens fictícias devem se inspirar nos exemplos fornecidos, mas nunca copiá-los.\n\n"

    "Regras para as alternativas:\n"
    "- Gere quatro alternativas plausíveis (A, B, C e D), com apenas UMA correta.\n"
    "- A correta representa a atitude mais segura. Nunca a torne óbvia.\n"
    "- Distribua a posição da resposta correta aleatoriamente entre A, B, C e D a cada desafio.\n"
    "- Cada alternativa deve ter uma justificativa curta, clara e educativa explicando por que está certa ou errada.\n\n"

    "Defina o nível de dificuldade com um destes valores: FACIL, MEDIO ou DIFICIL.\n\n"

    "Responda OBRIGATORIAMENTE neste formato JSON:\n\n"
    "{\n"
    '  "titulo": "Título curto do desafio",\n'
    '  "categoria": "Phishing | Pix | WhatsApp | E-mail | SMS | Redes Sociais | Outro",\n'
    '  "dificuldade": "FACIL | MEDIO | DIFICIL",\n'
    '  "mensagem": "Mensagem fictícia do desafio",\n'
    '  "alternativas": {\n'
    '    "A": {"texto": "Texto da alternativa", "justificativa": "Explicação educativa"},\n'
    '    "B": {"texto": "Texto da alternativa", "justificativa": "Explicação educativa"},\n'
    '    "C": {"texto": "Texto da alternativa", "justificativa": "Explicação educativa"},\n'
    '    "D": {"texto": "Texto da alternativa", "justificativa": "Explicação educativa"}\n'
    "  },\n"
    '  "resposta_correta": "A | B | C | D",\n'
    '"explicacao": "Explicação geral sobre por que essa mensagem é um golpe.",\n'
    '  "dica": "Dica curta para evitar golpes semelhantes."\n'
    "}\n\n"

    "Use a dificuldade e evite as categorias recentes informadas pelo contexto do jogador. "
    "Quanto mais acertos consecutivos, mais elaborada deve ser a mensagem fictícia, mesmo em nível FACIL."
)

sessao = {
    "acertos_totais": 0,
    "erros_totais": 0,
    "acertos_consecutivos": 0,
    "erros_consecutivos": 0,
    "dificuldade_atual": "FACIL",
    "categorias_vistas": [],
    "xp_total": 0,
    "nivel": 1
}

TEMPO_LIMITE = {"FACIL": 50, "MEDIO": 40, "DIFICIL": 30}
XP_BASE = {"FACIL": 10, "MEDIO": 25, "DIFICIL": 50}

def calcular_xp(dificuldade: str, tempo: float, acertos_consecutivos: int) -> int:
    limite = TEMPO_LIMITE[dificuldade]
    base = XP_BASE[dificuldade]

    # Bonus de velocidade
    if tempo <= limite * 0.5:
        bonus_tempo = int(base * 0.5)
    elif tempo <= limite:
        bonus_tempo = int(base * 0.2)
    else:
        bonus_tempo = 0

    # Bonus de sequência
    bonus_sequencia = acertos_consecutivos * 5

    return base + bonus_tempo + bonus_sequencia

def calcular_nivel(xp_total: int) -> int:
    nivel = 1
    xp_necessario = 100
    xp_acumulado = 0

    while xp_acumulado + xp_necessario <= xp_total:
        xp_acumulado += xp_necessario
        xp_necessario += 50
        nivel += 1

    return (xp_acumulado + xp_necessario) - xp_total

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


def calcular_dificuldade(sessao: dict) -> str:
  if sessao["acertos_consecutivos"] >=3:
    if sessao["dificuldade_atual"] == "FACIL":
      return "MEDIO"
    if sessao["dificuldade_atual"] == "MEDIO":
      return "DIFICIL"
    
  if sessao["erros_consecutivos"] >= 2:
    if sessao["dificuldade_atual"] == "DIFICIL":
      return "MEDIO"
    if sessao["dificuldade_atual"] == "MEDIO":
      return "FACIL"

  return sessao ["dificuldade_atual"]

def atualizar_sessao(sessao: dict, acertou: bool, categoria: str) -> None:
  if acertou:
    sessao["acertos_totais"] += 1
    sessao["acertos_consecutivos"] += 1
    sessao["erros_consecutivos"] = 0
  else:
    sessao["erros_totais"] += 1
    sessao["erros_consecutivos"] += 1
    sessao["acertos_consecutivos"] = 0

  sessao["categorias_vistas"].append(categoria)
  if len(sessao["categorias_vistas"]) > 3:
    sessao["categorias_vistas"].pop(0)
  
  sessao["dificuldade_atual"] = calcular_dificuldade(sessao)

def montar_contexto(sessao: dict) -> str:
    categorias_evitar = ", ".join(sessao["categorias_vistas"]) or "Nenhuma"
    
    return (
        f"Acertos consecutivos: {sessao['acertos_consecutivos']}\n"
        f"Erros consecutivos: {sessao['erros_consecutivos']}\n"
        f"Acertos totais: {sessao['acertos_totais']}\n"
        f"Erros totais: {sessao['erros_totais']}\n"
        f"Dificuldade atual: {sessao['dificuldade_atual']}\n"
        f"Categorias recentes a evitar: {categorias_evitar}\n\n"
        f"Gere um desafio de dificuldade {sessao['dificuldade_atual']} "
        f"que não seja das categorias: {categorias_evitar}."
    )

def main():
    api_key = os.getenv("IA_EhFraude")
    if not api_key:
        print("IA_EhFraude não encontrada. Configure o arquivo .env")
        return

    client = Groq(api_key=api_key)
    print("Modo Treino — Digite 'sair' para encerrar.\n")

    while True:
      contexto = montar_contexto(sessao)
      desafio = modelo_ia(client, contexto)

      if not desafio:
          print("Erro ao gerar desafio. Tente novamente.\n")
          continue
      

      letra_original = desafio["resposta_correta"]
      texto_correto = desafio["alternativas"][letra_original]
      alternativas = list(desafio["alternativas"].values())
      random.shuffle(alternativas)
      letras = ["A", "B", "C", "D"]
      alternativas_mapeadas = dict(zip(letras, alternativas))
      texto_correto = desafio["alternativas"][letra_original]["texto"]

      resposta_correta = next(
          letra for letra, alt in alternativas_mapeadas.items()
          if alt ["texto"] == texto_correto)
      
      for letra, alt in alternativas_mapeadas.items():
        print(f"{letra}) {alt['texto']}")

      print(f"\n--- {desafio['titulo']} ---")
      print(f"Categoria: {desafio['categoria']} | Dificuldade: {desafio['dificuldade']}")
      print(f"\n{desafio['mensagem']}\n")

      for letra, alt in alternativas_mapeadas.items():
        print(f"{letra}) {alt['texto']}")

      tempo_limite = TEMPO_LIMITE[desafio["dificuldade"]]
      print(f"⏱ Você tem {tempo_limite} segundos para responder!")

      inicio = time.time()
      resposta = input("\nSua resposta (A/B/C/D) ou 'sair': ").strip().upper()
      tempo_gasto = time.time() - inicio
      acertou = resposta == resposta_correta

      if resposta in ("SAIR", "EXIT", "Q"):
        print("Encerrando. Até mais!")
        break

      if resposta not in ("A", "B", "C", "D"):
        print("Resposta inválida. Digite A, B, C ou D.\n")
        continue

      alternativa_escolhida = alternativas_mapeadas[resposta]

      if acertou:
        xp_ganho = calcular_xp(desafio["dificuldade"], tempo_gasto, sessao["acertos_consecutivos"])
        sessao["xp_total"] += xp_ganho
        nivel_novo = calcular_nivel(sessao["xp_total"])
        print(f"\nCorreto! +{xp_ganho} XP (em {tempo_gasto:.1f}s)")
        print(f"{alternativa_escolhida['justificativa']}")

        if nivel_novo > sessao["nivel"]:
            sessao["nivel"] = nivel_novo
            print(f"LEVEL UP! Você chegou ao nível {nivel_novo}!")
      else:
          print(f"\nErrado! Você escolheu {resposta}: {alternativa_escolhida['texto']}")
          print(f"Por que estava errado: {alternativa_escolhida['justificativa']}")
          print(f"\nA resposta correta era {resposta_correta}: {alternativas_mapeadas[resposta_correta]['texto']}")
          print(f"Por que está certa: {alternativas_mapeadas[resposta_correta]['justificativa']}")

      print(f"{desafio['explicacao']}")
      print(f"Dica: {desafio['dica']}")
      print(f"\nAcertos: {sessao['acertos_totais']} | Erros: {sessao['erros_totais']}")
      print(f"XP: {sessao['xp_total']} | Faltam {calcular_nivel(sessao['xp_total'])} XP pro nível {sessao['nivel'] + 1}")


if __name__ == "__main__":
    main()