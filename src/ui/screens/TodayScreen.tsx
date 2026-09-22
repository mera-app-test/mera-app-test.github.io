// Glavni ekran „DANAS" (MS §15). U koraku 1 nema podataka ni plana — samo prazno stanje.
const dateFormatter = new Intl.DateTimeFormat("sr-Latn-RS", { weekday: "long", day: "numeric", month: "long" });

export function TodayScreen() {
  const today = dateFormatter.format(new Date());
  return (
    <section className="today" aria-labelledby="today-title">
      <header className="today-head">
        <h1 id="today-title" className="today-title">Danas</h1>
        <p className="today-date">{today}</p>
      </header>
      <div className="empty">
        <p className="empty-lead">Plan za danas još ne postoji.</p>
        <p className="empty-body">
          Mera je u izradi. Ovde će stajati obroci za danas, sa količinama i kalorijama.
        </p>
      </div>
    </section>
  );
}
