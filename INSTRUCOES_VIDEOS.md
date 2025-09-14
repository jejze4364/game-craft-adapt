# 🎥 Instruções para Integrar Vídeos no Simulador Zé Delivery

## 📁 Onde adicionar os vídeos

Os vídeos devem ser colocados na pasta `public/videos/` do projeto com os seguintes nomes:

```
public/videos/
├── 01-gestao-tempo.mp4
├── 02-disponibilidade.mp4
├── 03-portfolio.mp4
├── 04-aceitacao.mp4
├── 05-rastreamento.mp4
├── 06-otimizacao-rotas.mp4
├── 07-atendimento-cliente.mp4
├── 08-gestao-estoque.mp4
├── 09-prevencao-avarias.mp4
├── 10-protocolos-seguranca.mp4
├── 11-marketing-promocoes.mp4
├── 12-gestao-financeira.mp4
├── 13-relacionamento-fornecedores.mp4
├── 14-sustentabilidade.mp4
└── 15-analise-dados.mp4
```

## 🎯 Como funciona a integração

1. **Carregamento automático**: Os vídeos são carregados automaticamente com base no ID do checkpoint
2. **Formato do nome**: `{número}-{nome-do-topico}.mp4`
3. **Player integrado**: Cada checkpoint abre um modal com player de vídeo HTML5
4. **Fallback**: Se o vídeo não existir, mostra um placeholder

## 🔧 Especificações técnicas

- **Formato**: MP4 (H.264)
- **Resolução recomendada**: 1280x720 (HD) ou 1920x1080 (Full HD)
- **Duração sugerida**: 2-5 minutos por vídeo
- **Tamanho**: Máximo 50MB por vídeo (para melhor performance)
- **Codificação**: H.264 com AAC para áudio

## 📋 Tópicos dos checkpoints

1. **Gestão de Tempo** - Como gerenciar horários e disponibilidade
2. **Disponibilidade** - Importância de manter a loja aberta  
3. **Portfólio** - Gestão de produtos e variedade
4. **Aceitação** - Como melhorar aceitação de pedidos
5. **Rastreamento** - GPS e rastreamento em tempo real
6. **Otimização Rotas** - Estratégias para entregas eficientes
7. **Atendimento** - Excelência no atendimento ao cliente
8. **Gestão Estoque** - Controle eficiente de produtos
9. **Prevenção Avarias** - Cuidados com produtos sensíveis
10. **Protocolos Segurança** - Segurança nas entregas
11. **Marketing** - Estratégias de vendas e promoções
12. **Gestão Financeira** - Controle de custos e lucros
13. **Fornecedores** - Parcerias estratégicas
14. **Sustentabilidade** - Práticas ambientalmente responsáveis
15. **Análise Dados** - Uso de métricas para melhorias

## 🚀 Após adicionar os vídeos

1. Coloque os arquivos na pasta `public/videos/`
2. Mantenha os nomes exatos conforme listado
3. Teste no simulador clicando nos pontos 📦 no mapa
4. Os vídeos aparecerão automaticamente nos modais

## 🎮 Outras melhorias implementadas

- ✅ **Animação suavizada**: Checkpoints agora flutuam mais suavemente
- ✅ **Ícone atualizado**: Jogador agora é uma moto 🏍️ ao invés de van
- ✅ **15 checkpoints completos**: Todos os tópicos educativos implementados
- ✅ **Sistema de vídeos**: Player HTML5 integrado com controles

## 🎯 Próximos passos

1. Grave/obtenha os 15 vídeos educativos
2. Processe-os no formato MP4 
3. Adicione na pasta `public/videos/`
4. Teste cada checkpoint no jogo