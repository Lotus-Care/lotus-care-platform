import Image from "next/image";

interface UserHeaderProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function UserHeader({ name, email, image }: UserHeaderProps) {
  const firstName = name?.split(" ")[0] || "Usuário";

  return (
    <div className="mb-6 flex items-center gap-4">
      {image && (
        <Image
          src={image}
          alt="Avatar"
          width={64}
          height={64}
          className="h-16 w-16 rounded-full border-2 border-[var(--border)]"
        />
      )}
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
          Bem-vindo, {firstName}!
        </h1>
        {email && (
          <p className="mt-2 text-[var(--muted-foreground)]">{email}</p>
        )}
      </div>
    </div>
  );
}

