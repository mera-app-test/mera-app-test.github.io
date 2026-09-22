// Prikaz kada podaci ne mogu da se otvore (npr. neuspela migracija vraćena iz zaštitne kopije).
export function StartupError({ message }: { message: string }) {
  return (
    <div className="app">
      <main className="main">
        <h1 className="today-title">Mera ne može da otvori podatke</h1>
        <p className="startup-error">{message}</p>
        <p className="muted">Podaci nisu obrisani. Pošalji ovu poruku razvojnom agentu.</p>
        <button type="button" className="btn btn-secondary" onClick={() => location.reload()}>
          Pokušaj ponovo
        </button>
      </main>
    </div>
  );
}
