import logoIcon from "../assets/devstor-finance-logo.png";

export default function AuthLayout({ eyebrow, title, children }) {
  return (
    <div className="flex min-h-screen flex-col justify-between bg-paper px-6 py-10 dark:bg-ink">
      <div className="mx-auto w-full max-w-sm">
        <div className="auth-card">
          <div className="mb-6 flex flex-col items-center text-center">
            <img
              src={logoIcon}
              alt="Devstor Finance"
              className="h-24 w-24 object-contain"
              width={96}
              height={96}
            />
            <p className="mt-2 text-lg font-bold tracking-tight text-ink dark:text-paper">
              Devstor Finance
            </p>
          </div>

          {eyebrow && (
            <p className="mb-1 text-sm text-ink/55 dark:text-paper/55">{eyebrow}</p>
          )}
          {title && (
            <h1 className="mb-8 font-sans text-2xl font-bold leading-tight tracking-tight text-ink dark:text-paper">
              {title}
            </h1>
          )}

          {children}
        </div>
      </div>

      <p className="mx-auto mt-10 text-center text-xs text-ink/55 dark:text-paper/55">
        A Devstor Project · Nestor Moreno
      </p>
    </div>
  );
}