import StudioPage from "@/components/StudioPage";

/**
 * Professor entra no estúdio da aula ao vivo a partir do dashboard.
 * Usa o mesmo StudioPage do admin, com redirect de volta para as lives do professor.
 */
export default function TeacherStudioPage() {
  return <StudioPage redirectAfterEnd="/dashboard/teacher/lives" />;
}
