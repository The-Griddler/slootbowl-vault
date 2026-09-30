import { getAllTimeRecords } from "../../lib/records";
import RecordsTabs from "./RecordsTabs";

export default async function RecordsPage() {
  const records = await getAllTimeRecords();

  return (
    <main>
      <p
        style={{
          fontSize: "12px",
          fontWeight: "700",
          letterSpacing: "1.5px",
          color: "#687384",
          marginBottom: "8px",
        }}
      >
        DYNASTY SLUTS
      </p>

      <h1>Records</h1>

      <p
        style={{
          marginTop: "8px",
          marginBottom: "24px",
        }}
      >
        The Dynasty Sluts record book.
      </p>

      <RecordsTabs records={records} />
    </main>
  );
}