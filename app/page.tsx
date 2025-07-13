  import { redirect } from "next/navigation";

  export default function Home() {
    redirect("/login");
    return null; // não precisa renderizar nada porque redireciona imediatamente
  }
