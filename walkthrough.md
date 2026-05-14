# Walkthrough - Desafio Perda de Peso

Este guia explica como navegar e utilizar o Web App de Registro de Peso.

## 1. Tela de Acesso (Login/Cadastro)
Ao abrir o app, você verá uma tela elegante com efeito de vidro (glassmorphism).
- **Cadastro**: Informe seu nome, e-mail e seu peso de hoje. O app usará esse peso como base para calcular sua meta de 4%.
- **Login**: Use apenas o seu e-mail cadastrado para entrar a qualquer momento.

## 2. Dashboard Principal
O dashboard foi projetado para dar uma visão clara do seu progresso:
- **KPIs (Cards)**:
  - **Peso Atual**: O último peso que você registrou.
  - **Meta**: Exatamente 96% do seu peso inicial.
  - **Faltam**: Quantos quilos você ainda precisa perder para bater a meta.
  - **Progresso**: Uma porcentagem que vai de 0% a 100% (ou mais!).
- **Novo Peso**: Clique no botão "+" para abrir o modal e inserir seu peso do dia.

## 3. Visualizações de Dados
- **Sua Evolução**: Um gráfico de linha que mostra sua trajetória. A linha tracejada vermelha é sua meta.
- **Ranking da Galera**: Um gráfico de barras que compara todos os usuários. Ele mostra quem perdeu a maior *porcentagem* de peso, tornando a competição justa para todos, independente do peso inicial.

## 4. Painel do Fiscal (Acesso Master)
Para você gerenciar o desafio, criei um acesso especial de supervisor:
- **E-mail de Acesso**: `master@desafio.com`
- **Funcionalidades**:
  - Visualização de todos os participantes em uma tabela.
  - Monitoramento de peso inicial, peso atual e meta de cada um.
  - Status de progresso visual (verde para quem bateu a meta).
  - **Botão Editar (Lápis)**: Permite corrigir o peso inicial de um participante, recalculando automaticamente a meta dele.
  - **Botão Remover**: Permite excluir um participante do desafio.

## 5. Comemoração
Assim que você atingir ou ultrapassar sua meta, o app exibirá uma mensagem de **PARABÉNS** em destaque no topo, mas continuará permitindo que você registre novos pesos para manter o hábito saudável.

## 5. Persistência
Todos os dados são salvos no seu navegador (LocalStorage). Isso significa que, se você fechar o app e abrir depois, seus dados e os dos seus colegas (registrados no mesmo computador) continuarão lá.

---
**Dica**: Para usar com colegas em computadores diferentes, seria necessário um banco de dados na nuvem (como Supabase ou Firebase). Esta versão é ideal para um "totem" de pesagem comum ou para demonstração imediata!
