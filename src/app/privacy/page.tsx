import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Política de Privacidade",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gray-950">
      <div className="mx-auto max-w-3xl px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="group mb-8 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
            <ArrowRight className="h-3.5 w-3.5 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            Voltar
          </Link>
          <p className="font-mono text-[13px] uppercase tracking-[0.25em] text-purple/70 mb-3">
            // legal
          </p>
          <h1 className="text-3xl font-bold text-white mb-4">Política de Privacidade</h1>
          <p className="text-sm text-gray-500">Última atualização: 22 de Agosto de 2026</p>
        </div>

        {/* Conteúdo */}
        <div className="space-y-10 text-sm leading-relaxed text-gray-400">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Informações que Recolhemos</h2>
            <p className="mb-3">Podemos recolher os seguintes tipos de informações:</p>
            <ul className="mt-2 ml-5 list-disc space-y-1 text-gray-400">
              <li><strong className="text-gray-200">Dados de registo:</strong> nome, email, telefone, país, nacionalidade, morada, idade e género</li>
              <li><strong className="text-gray-200">Dados de pagamento:</strong> processados por parceiros de pagamento certificados (não armazenamos dados de cartões)</li>
              <li><strong className="text-gray-200">Dados de uso:</strong> cursos assistidos, progresso, interações na plataforma, tempo de estudo</li>
              <li><strong className="text-gray-200">Dados técnicos:</strong> endereço IP, tipo de dispositivo, navegador, sistema operativo</li>
              <li><strong className="text-gray-200">Conteúdo gerado:</strong> mensagens no chat, comentários, avaliações de cursos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Como Utilizamos as Informações</h2>
            <p className="mb-3">Utilizamos os seus dados para:</p>
            <ul className="mt-2 ml-5 list-disc space-y-1 text-gray-400">
              <li>Fornecer e melhorar os nossos serviços educacionais</li>
              <li>Personalizar a sua experiência de aprendizagem</li>
              <li>Processar pagamentos e gerir assinaturas</li>
              <li>Comunicar sobre actualizações, novos cursos e eventos</li>
              <li>Garantir a segurança da plataforma e prevenir fraude</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Partilha de Dados</h2>
            <p className="mb-3">Não vendemos os seus dados pessoais. Podemos partilhar informações com:</p>
            <ul className="mt-2 ml-5 list-disc space-y-1 text-gray-400">
              <li><strong className="text-gray-200">Professores:</strong> dados de progresso e interação dos seus cursos</li>
              <li><strong className="text-gray-200">Instituições parceiras:</strong> dados dos seus alunos membros</li>
              <li><strong className="text-gray-200">Prestadores de serviços:</strong> hospedagem (Firebase/Google), pagamentos, email transacional</li>
              <li><strong className="text-gray-200">Autoridades legais:</strong> quando exigido por lei</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Cookies e Tecnologias Semelhantes</h2>
            <p className="mb-3">
              Utilizamos cookies e tecnologias semelhantes para melhorar a sua experiência, analisar o uso da plataforma e personalizar conteúdos.
            </p>
            <p>
              Pode gerir as preferências de cookies através das definições do seu navegador. A recusa de cookies pode afetar funcionalidades da Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Segurança dos Dados</h2>
            <p className="mb-3">
              Implementamos medidas de segurança técnicas e organizacionais para proteger os seus dados, incluindo encriptação SSL/TLS, autenticação segura e acesso restrito a dados pessoais.
            </p>
            <p>
              Nenhum método de transmissão pela Internet ou armazenamento electrónico é 100% seguro, mas esforçamo-nos para usar os meios comercialmente aceitáveis para proteger os seus dados.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Retenção de Dados</h2>
            <p className="mb-3">
              Os seus dados pessoais são mantidos enquanto a sua conta estiver activa ou enquanto for necessário para fornecer serviços.
            </p>
            <p>
              Pode solicitar a eliminação da sua conta e dados pessoais contactando-nos em{" "}
              <a href="mailto:apoio@netsulwel.tech" className="text-purple/80 hover:text-purple-light transition-colors">
                apoio@netsulwel.tech
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Os Seus Direitos</h2>
            <p className="mb-3">De acordo com a legislação aplicável, tem direito a:</p>
            <ul className="mt-2 ml-5 list-disc space-y-1 text-gray-400">
              <li>Aceder aos seus dados pessoais</li>
              <li>Corrigir dados incorrectos ou incompletos</li>
              <li>Solicitar a eliminação dos seus dados</li>
              <li>Opor-se ao processamento dos seus dados</li>
              <li>Solicitar a portabilidade dos seus dados</li>
              <li>Retirar o consentimento a qualquer momento</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Dados de Menores</h2>
            <p>
              A Plataforma não é destinada a menores de 12 anos. Não recolhemos intencionalmente dados de menores de 12 anos. Se descobrirmos que recolhemos dados de um menor, eliminaremos essa informação imediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Transferências Internacionais</h2>
            <p>
              Os seus dados podem ser processados em servidores localizados fora do seu país de residência. Ao utilizar a Plataforma, consente com a transferência das suas informações para esses locais.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Alterações a Esta Política</h2>
            <p>
              Podemos actualizar esta Política de Privacidade periodicamente. As alterações serão publicadas nesta página com a data de &quot;Última atualização&quot; actualizada. Recomendamos que reveja esta política regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Contacto</h2>
            <p>
              Para exercer os seus direitos ou esclarecer dúvidas sobre esta Política, contacte-nos em{" "}
              <a href="mailto:apoio@netsulwel.tech" className="text-purple/80 hover:text-purple-light transition-colors">
                apoio@netsulwel.tech
              </a>
            </p>
          </section>

        </div>

        {/* Rodapé */}
        <div className="mt-16 border-t border-gray-800 pt-8 flex items-center justify-between">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-400 transition-colors">
            &larr; Voltar ao início
          </Link>
          <Link href="/terms" className="text-sm text-gray-600 hover:text-gray-400 transition-colors">
            Termos de Uso &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
