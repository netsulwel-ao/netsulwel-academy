"use client";

import { useState } from "react";
import {
  LayoutDashboard, Folders, Video, Layers, Calendar, Radio,
  GraduationCap, Users, DollarSign, MessageSquare, Settings,
  Megaphone, BookOpen, ChevronDown, ChevronRight, ExternalLink,
  ShieldCheck, Lightbulb, AlertTriangle, ArrowRight, Search,
  Monitor, Globe, Sparkles
} from "lucide-react";

type Section = {
  id: string;
  icon: typeof BookOpen;
  title: string;
  desc: string;
  content: { label: string; text: string }[];
};

const sections: Section[] = [
  {
    id: "visao-geral",
    icon: LayoutDashboard,
    title: "Visão Geral (Dashboard)",
    desc: "Painel principal com métricas e atalhos rápidos.",
    content: [
      { label: "O que mostra (Admin)", text: "Cards com estatísticas: total de alunos, professores, cursos, receita do mês e acessos do dia. Gráficos: evolução de alunos (7 dias), distribuição de cursos por tipo (standalone/smart/golden) e receita dos últimos 6 meses." },
      { label: "O que mostra (Professor)", text: "Cards adaptados: meus alunos, meus cursos, receita do mês e acessos do dia. Gráficos apenas com os dados dos seus próprios cursos." },
      { label: "Atalhos rápidos (Admin)", text: "Abaixo dos gráficos encontra atalhos para: Criar Curso, Aula ao Vivo, Alunos, Professores, Comunidade, Anúncio, Trilhas e Configurações. Mais o link \"Gerir Utilizadores\"." },
      { label: "Atalhos rápidos (Professor)", text: "Atalhos adaptados: Criar Curso, Aula ao Vivo, Os Meus Alunos, As Minhas Vendas, Anúncio e Trilhas." },
    ],
  },
  {
    id: "cursos",
    icon: Folders,
    title: "Cursos",
    desc: "Gerir cursos gravados e ao vivo.",
    content: [
      { label: "Listar cursos", text: "Em /admin/courses encontra todos os cursos em formato de cards. Cada card mostra miniatura, título, número de módulos/aulas, estado (Publicado/Rascunho) e formato (gravado/ao vivo). Admins veem todos os cursos; professores só os seus." },
      { label: "Criar curso", text: "Clique em \"Criar Curso\" e preencha: título, descrição, miniatura, módulos com vídeos, tipo (standalone/smart/golden), formato (gravado/ao vivo) e estado. Pode associar a uma trilha de aprendizagem." },
      { label: "Editar curso", text: "No card do curso clique \"Editar\". Altere qualquer campo e salve. Se o formato for \"ao vivo\", aparece no fim da página um link \"Gerir Aulas ao Vivo\"." },
      { label: "Gerir Aulas ao Vivo do Curso", text: "Em /admin/courses/[id]/live-studio, para cursos com formato \"ao vivo\". Lista todos os módulos/aulas que têm data agendada. Cada aula mostra status: Agendada (scheduled), Ao Vivo (live) ou Realizada (ended). Clique \"Transmitir\" para iniciar a aula agendada." },
      { label: "Eliminar curso", text: "Clique no ícone de eliminar no card. Um modal de confirmação aparece antes de remover." },
      { label: "Link de pré-visualização", text: "Cada curso tem um link de pré-visualização (/preview/course/[id]) que pode copiar e partilhar com alunos antes da publicação." },
    ],
  },
  {
    id: "aulas-ao-vivo",
    icon: Radio,
    title: "Aulas ao Vivo (Live Studio)",
    desc: "Criar, agendar e transmitir aulas ao vivo.",
    content: [
      { label: "Criar sessão", text: "Vá a /admin/lives e clique \"Criar Aula\". Preencha título, descrição, data/hora, plano alvo (Gratuito/Smart/Golden) e faça upload da miniatura." },
      { label: "Iniciar transmissão", text: "Na lista de aulas, clique \"Entrar no Estúdio\" para abrir o LiveKit Studio. Ligue câmara e microfone, e clique \"Iniciar\" quando pronto. O estado muda automaticamente para \"Ao Vivo\"." },
      { label: "Durante a live", text: "Tem controlos de microfone, câmara, partilha de ecrã. Painel de chat para interagir com alunos. Painel de participantes para ver quem entrou. Pode silenciar/ativar microfone dos participantes." },
      { label: "Encerrar", text: "Clique no botão \"Terminar\" para acabar a transmissão. Um modal de confirmação aparece. Todos os participantes são desconectados e o estado muda para \"Encerrada\"." },
    ],
  },
  {
    id: "trilhas",
    icon: Layers,
    title: "Trilhas de Aprendizagem",
    desc: "Agrupar cursos e lives em percursos formativos.",
    content: [
      { label: "Criar trilha", text: "Vá a /admin/trails e clique \"Criar Trilha\". Dê um nome, descrição, escolha o tipo (Golden/Smart/Standalone), nível, categoria e selecione os cursos e aulas ao vivo que farão parte da trilha." },
      { label: "Editar trilha", text: "Clique \"Editar\" na trilha. Pode alterar cursos associados, descrição, estado (Publicada/Rascunho)." },
      { label: "Eliminar trilha", text: "Clique no ícone de eliminar. A trilha é removida mas os cursos e lives associados não são apagados." },
    ],
  },
  {
    id: "cronograma",
    icon: Calendar,
    title: "Cronograma",
    desc: "Organizar a sequência de aulas ao vivo dentro de cada trilha.",
    content: [
      { label: "Adicionar sessão", text: "Expanda uma trilha e clique \"Adicionar Sessão\". Preencha título, descrição, data/hora, plano alvo e preço (se standalone)." },
      { label: "Reordenar", text: "Use os botões ▲ e ▼ para mudar a ordem das sessões dentro da trilha." },
      { label: "Guardar", text: "Cada trilha tem o seu próprio botão \"Guardar\". Só aparece se houver alterações por salvar." },
    ],
  },
  {
    id: "professores",
    icon: GraduationCap,
    title: "Professores",
    desc: "Gerir professores da plataforma (apenas admin).",
    content: [
      { label: "Listar", text: "Vê todos os professores registados, com nome, email, data de registo e número de cursos." },
      { label: "Promover a Admin", text: "No drawer de detalhes de um professor, clique \"Promover a Admin\". O professor passa a ter acesso total à plataforma." },
      { label: "Remover Teacher", text: "Pode rebaixar um professor a aluno comum. O utilizador perde acesso ao painel admin." },
      { label: "Tornar aluno em professor", text: "Vá a /admin/students, encontre o aluno e clique \"Promover a Professor\"." },
    ],
  },
  {
    id: "alunos",
    icon: Users,
    title: "Alunos",
    desc: "Gerir todos os alunos inscritos.",
    content: [
      { label: "Pesquisar e ordenar", text: "Busque por nome ou email. Pode ordenar por nome (A-Z) ou por mais recentes." },
      { label: "Detalhes", text: "Clique num aluno para abrir um drawer com informações completas: nome, email, plano (Free/Smart/Golden), data de registo, cursos com acesso, tipo de acesso (Compra/Plano) e ID do utilizador." },
      { label: "Promover a Professor", text: "No drawer de detalhes, clique \"Promover a Professor\" para dar acesso ao painel de professor." },
    ],
  },
  {
    id: "vendas",
    icon: DollarSign,
    title: "Vendas",
    desc: "Gerir pagamentos e confirmações de compras.",
    content: [
      { label: "Visão geral", text: "Cards com Receita Total, Este Mês, Vendas Confirmadas e Pendentes. Tabela com todas as vendas: nome do cliente, email, item, tipo, valor (Kz), método de pagamento e status." },
      { label: "Filtros", text: "Filtre por status (Pendente/Confirmada/Cancelada) e por tipo (Standalone/Smart/Golden). Use a busca por nome/email/referência." },
      { label: "Confirmar venda", text: "No dropdown de status da venda, selecione \"Confirmada\". O sistema automaticamente adiciona o curso ou plano ao aluno. Uma notificação in-app é enviada ao aluno." },
      { label: "Reverter confirmação", text: "Se mudar de Confirmada para Pendente ou Cancelada, o acesso do aluno ao curso/plano é removido automaticamente." },
      { label: "Cancelar venda", text: "Mude o status para \"Cancelada\". O acesso do aluno ao curso/plano é removido." },
      { label: "Comprovativo", text: "Se o aluno fez upload de comprovativo de pagamento (recibo), aparece um ícone de ficheiro na tabela para visualizar." },
    ],
  },
  {
    id: "comunidade",
    icon: MessageSquare,
    title: "Comunidade",
    desc: "Moderar os posts dos alunos.",
    content: [
      { label: "Visão geral", text: "Cards no topo mostram total de posts, total de comentários e total de curtidas em toda a comunidade." },
      { label: "Listar posts", text: "Tabela com todos os posts: título, autor, tipo (dúvida/projeto/discussão), curtidas e comentários. Pode pesquisar por título ou nome do autor." },
      { label: "Eliminar post", text: "Clique no ícone de eliminar para remover um post. A ação é irreversível — o post e todos os comentários são apagados." },
      { label: "Visualizar", text: "Clique no link externo para abrir o post no dashboard do aluno e ver o conteúdo completo." },
    ],
  },
  {
    id: "anuncios",
    icon: Megaphone,
    title: "Anúncios",
    desc: "Criar e gerir banners e comunicados.",
    content: [
      { label: "Criar anúncio", text: "Clique \"Criar Anúncio\". Escolha o tipo (Promoção, Novo Curso, Aula ao Vivo, Aviso Geral), plano alvo (Todos/Free/Smart/Golden), título, mensagem, link, imagem de fundo (upload via R2) e datas de início/fim. Pode escolher um ícone para o banner." },
      { label: "Banner com contagem regressiva", text: "Ative \"Mostrar contagem regressiva\" e defina a data/hora de fim. Escolha o estilo do countdown entre as variantes disponíveis. Ideal para promoções com prazo limitado." },
      { label: "Guardar como rascunho", text: "Pode salvar o anúncio como rascunho. Anúncios em rascunho não aparecem no frontend até serem ativados." },
      { label: "Ativar/Desativar", text: "Use o toggle para ativar ou desativar um anúncio sem o eliminar." },
      { label: "Editar", text: "Clique num anúncio para abrir o modal de edição pré-preenchido com os dados existentes." },
    ],
  },
  {
    id: "utilizadores",
    icon: ShieldCheck,
    title: "Utilizadores",
    desc: "Gestão completa de todos os utilizadores (apenas admin).",
    content: [
      { label: "Visão geral", text: "Cards com total de utilizadores, alunos e admins. Filtre por role (Todos/Alunos/Admins) ou pesquise por nome/email." },
      { label: "Promover/Remover Admin", text: "No menu de contexto de cada utilizador ou no drawer de detalhes, clique \"Promover a Admin\" ou \"Remover Admin\"." },
    ],
  },
  {
    id: "configuracoes",
    icon: Settings,
    title: "Configurações",
    desc: "Afinar plataforma: planos, pagamentos, redes sociais, contacto e SEO.",
    content: [
      { label: "Planos", text: "Defina o preço e as descrições dos planos Smart e Golden. Pode adicionar/remover funcionalidades de cada plano." },
      { label: "Pagamentos", text: "Configure métodos de pagamento: Transferência Bancária (dados da conta), Multicaixa Express (entidade+referência), PayPal (email+client ID) e Stripe (chave pública). Ative/desative cada método." },
      { label: "Redes Sociais", text: "Links para Instagram, YouTube, Facebook, Twitter/X, LinkedIn, Discord, WhatsApp e TikTok." },
      { label: "Contacto", text: "Email geral, email de suporte, telefone/WhatsApp e endereço físico." },
      { label: "SEO", text: "Defina meta description (máx 160 caracteres) e meta keywords para optimização nos motores de busca." },
    ],
  },
];

export default function AdminManualPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["visao-geral"]));
  const [searchQuery, setSearchQuery] = useState("");

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = sections.filter(s =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.content.some(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()) || c.text.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const globalActions = [
    { icon: Search, label: "Pesquisa rápida", text: "Pressione / (barra) em qualquer página do admin para focar a barra de pesquisa na sidebar e encontrar rapidamente uma secção." },
    { icon: Monitor, label: "Alternar tema", text: "No fundo da sidebar, use os botões Sol/Lua para alternar entre tema claro e escuro." },
    { icon: Globe, label: "Acesso a professores", text: "Professores têm acesso limitado: só veem os seus próprios cursos, alunos e vendas. Não acedem a Configurações, Utilizadores ou Professores." },
    { icon: Sparkles, label: "Dica", text: "Mantenha a sidebar recolhida (clique no ícone <<) para ganhar mais espaço no ecrã. Passe o rato sobre os ícones para ver o nome de cada secção." },
  ];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600/10">
            <BookOpen className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Manual do Administrador</h1>
            <p className="text-gray-400 text-sm">Guia completo de todas as funcionalidades do painel de gestão</p>
          </div>
        </div>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Pesquisar no manual..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-2.5 pl-10 pr-4 text-sm bg-gray-900 border border-gray-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-600 transition-colors"
          />
        </div>
      </div>

      {/* Ações Globais */}
      <div className="mb-10">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
          <Lightbulb className="w-3.5 h-3.5" />
          Dicas Gerais
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {globalActions.map((action, idx) => (
            <div key={idx} className="flex gap-3 p-4 bg-gray-900/50 border border-gray-800 hover:border-gray-700 transition-colors">
              <action.icon className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white mb-0.5">{action.label}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{action.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Secções do Manual */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p>Nenhum resultado para &quot;{searchQuery}&quot;</p>
          </div>
        )}
        {filtered.map((section) => (
          <div key={section.id} className="border border-gray-800 overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-900/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600/10">
                  <section.icon className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-white">{section.title}</h2>
                  <p className="text-xs text-gray-500">{section.desc}</p>
                </div>
              </div>
              {openSections.has(section.id) ? (
                <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500 shrink-0" />
              )}
            </button>
            {openSections.has(section.id) && (
              <div className="border-t border-gray-800">
                {section.content.map((item, idx) => (
                  <div key={idx} className="p-4 pl-[4.5rem] pr-4 border-b border-gray-800/50 last:border-b-0">
                    <h3 className="text-sm font-medium text-blue-300 mb-1.5 flex items-center gap-2">
                      <ArrowRight className="w-3 h-3 text-blue-500" />
                      {item.label}
                    </h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{item.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-800 text-center">
        <p className="text-xs text-gray-600">
          Netsulwel Academy &mdash; Manual v1.0 &mdash; Atualizado em Junho 2026
        </p>
        <p className="text-xs text-gray-700 mt-1">
          Precisa de ajuda? Contacte o suporte técnico.
        </p>
      </div>
    </div>
  );
}
