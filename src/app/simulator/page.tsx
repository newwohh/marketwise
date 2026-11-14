import { Simulator } from "@/components/simulator";
import { getMarkets } from "@/lib/markets";
export const metadata = { title: "Investment simulator" };
export const revalidate = 300;
export default async function SimulatorPage() { return <Simulator quotes={await getMarkets("crypto")} />; }
