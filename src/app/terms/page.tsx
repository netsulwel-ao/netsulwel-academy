import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Termos de Uso",
};

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-white mb-4">Termos de Uso</h1>
          <p className="text-sm text-gray-500">Última atualização: 22 de Agosto de 2026</p>
        </div>

        {/* Conteúdo */}
        <div className="space-y-10 text-sm leading-relaxed text-gray-400">

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">1. Aceitação dos Termos</h2>
            <p className="mb-3">
              Ao aceder, registar-se ou utilizar a plataforma <strong className="text-gray-200">Netsulwel Academy</strong>
              {""} (&quot;Plataforma&quot;), o utilizador concorda com estes Termos de Uso. Se não concordar, não deve utilizar a Plataforma.
            </p>
            <p>
              Estes Termos aplicam-se a todos os utilizadores, incluindo alunos, professores e instituições parceiras.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">2. Descrição do Serviço</h2>
            <p className="mb-3">
              A Netsulwel Academy é uma plataforma de educação online que oferece cursos, trilhas de aprendizagem, mentorias ao vivo e conteúdo interactivo nas áreas de tecnologia, finanças e investimentos.
            </p>
            <p>A Plataforma inclui, entre outros:</p>
            <ul className="mt-2 ml-5 list-disc space-y-1 text-gray-400">
              <li>Cursos em vídeo e materiais complementares</li>
              <li>Sessões de mentoria ao vivo</li>
              <li>Comunidade de aprendizagem</li>
              <li>Sistema de certificação</li>
              <li>Ferramentas de gestão para professores e instituições</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">3. Registo e Conta</h2>
            <p className="mb-3">
              Para aceder a funcionalidades completas, o utilizador deve criar uma conta com informações verdadeiras e actualizadas.
            </p>
            <p className="mb-3">
              O utilizador é responsável por manter a confidencialidade das suas credenciais de acesso e por todas as actividades que ocorram na sua conta.
            </p>
            <p>
              É proibido compartilhar credenciais de acesso ou criar contas falsas. A Netsulwel Academy reserva-se o direito de suspender ou eliminar contas que violem estes Termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">4. Planos e Pagamentos</h2>
            <p className="mb-3">
              A Plataforma oferece planos gratuitos e pagos. Os preços e condições dos planos pagos são apresentados na página de planos e podem ser alterados previamente aviso.
            </p>
            <p className="mb-3">
              Os pagamentos são processados de forma segura através de parceiros de pagamento. A Netsulwel Academy não armazena dados de cartões de crédito.
            </p>
            <p>
              Reembolsos são avaliados caso a caso, dentro de 14 dias após a compra, desde que o utilizador não tenha consumido mais de 20% do conteúdo do curso.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">5. Conteúdo e Propriedade Intelectual</h2>
            <p className="mb-3">
              Todo o conteúdo disponibilizado na Plataforma — incluindo vídeos, textos, imagens, gráficos, software e materiais didácticos — é propriedade da Netsulwel Academy ou dos seus professores licenciados.
            </p>
            <p>
              O utilizador não pode reproduzir, distribuir, modificar, criar obras derivadas, exibir publicamente ou explorar comercialmente qualquer conteúdo da Plataforma sem autorização prévia por escrito.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">6. Conduta do Utilizador</h2>
            <p className="mb-3">O utilizador compromete-se a:</p>
            <ul className="mt-2 ml-5 list-disc space-y-1 text-gray-400">
              <li>Utilizar a Plataforma de acordo com a lei e estes Termos</li>
              <li>Não publicar conteúdo ofensivo, discriminatório ou ilegal</li>
              <li>Não tentar aceder não autorizado a sistemas ou contas de outros utilizadores</li>
              <li>Não utilizar a Plataforma para fins comerciais não autorizados</li>
              <li>Não distribuir vírus ou código malicioso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">7. Professores e Conteúdo</h2>
            <p className="mb-3">
              Professores que publiquem conteúdos na Plataforma garantem que possuem os direitos necessários sobre o conteúdo e que este não viola direitos de terceiros.
            </p>
            <p>
              A Netsulwel Academy reserva-se o direito de remover conteúdos que violem estes Termos ou que consider inadequados, sem aviso prévio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">8. Isenção de Responsabilidade</h2>
            <p className="mb-3">
              A Plataforma é fornecida &quot;como está&quot;, sem garantias de qualquer tipo. A Netsulwel Academy não garante que o serviço será ininterrupto, seguro ou livre de erros.
            </p>
            <p>
              Em nenhuma circunstância a Netsulwel Academy será responsável por danos indirectos, incidentais, especiais ou consequenciais resultantes do uso da Plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">9. Modificações</h2>
            <p>
              A Netsulwel Academy reserva-se o direito de modificar estes Termos a qualquer momento. As alterações entram em vigor na data da publicação. O uso continuado da Plataforma após as alterações constitui aceitação dos novos Termos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">10. Legislação Aplicável</h2>
            <p>
              Estes Termos são regidos pelas leis da República de Angola. Qualquer disputa será resolvida nos tribunais competentes de Luanda, Angola.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-white mb-3">11. Contacto</h2>
            <p>
              Para dúvidas sobre estes Termos, contacte-nos em{" "}
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
          <Link href="/privacy" className="text-sm text-gray-600 hover:text-gray-400 transition-colors">
            Política de Privacidade &rarr;
          </Link>
        </div>
      </div>
    </main>
  );
}
