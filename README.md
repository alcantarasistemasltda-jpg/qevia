# QEVIA — Clareza para sua vida financeira

O **QEVIA** é uma plataforma moderna e completa de gestão financeira pessoal e empresarial leve, focada em clareza, previsibilidade e usabilidade excepcional.

---

## 🚀 Módulos e Recursos

- **Dashboard Executivo:** Visão unificada de saldo disponível, saldo projetado, resumo mensal de receitas vs despesas, gráficos de evolução e indicadores de saúde financeira.
- **Extrato & Lançamentos:** Gestão completa de transações (receitas, despesas, transferências e pagamentos de fatura), compras parceladas e filtros rápidos com chips visuais interativos.
- **Contas & Carteiras:** Acompanhamento de saldos em tempo real por instituição, contas digitais, poupanças e investimentos.
- **Cartões & Faturas:** Controle de limites utilizados/disponíveis, fechamento e vencimento de faturas com detalhamento de itens.
- **Planejamento & Metas:** Orçamentos mensais inteligentes por categoria com cálculo automático de consumo e limites.
- **Compromissos Financeiros:** Controle preciso de contas a pagar e a receber com timeline, status de liquidação e sem duplicação contábil.
- **Central de Alertas Financeiros:** Motor automático de avaliação de vencimentos próximos (`BILL_DUE`), estouro de orçamento (`BUDGET_LIMIT`), saldo baixo (`LOW_BALANCE`) e faturas.
- **Relatórios & Análises:** Análise factual por período, fluxo de caixa, evolução de patrimônio líquido e distribuição por categoria.
- **Privacidade Instantânea:** Modo de ocultação de valores (`useHideValues`) presente em todo o sistema.

---

## 🛠️ Stack Tecnológica

- **Frontend:** Next.js (App Router), React 19, TypeScript, Tailwind CSS
- **Backend & Auth:** Supabase (PostgreSQL, RLS, Auth)
- **Ícones:** Lucide Icons
- **Design System:** Dark Mode / Light Mode nativo, Mobile-First (360px a 1440px+)

---

## 💻 Como Rodar o Projeto

1. Clone o repositório:
```bash
git clone https://github.com/alcantarasistemasltda-jpg/qevia.git
cd qevia
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente em `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=seu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_supabase_anon_key
```

4. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse no navegador:
[http://localhost:3000](http://localhost:3000)

---

## 📜 Licença

Propriedade de Alcântara Sistemas LTDA. Todos os direitos reservados.
