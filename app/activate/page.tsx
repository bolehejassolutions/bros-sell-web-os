import { redirect } from "next/navigation";

const SALES_PAGE = "https://bros.bolehejas.com";

export default async function ActivatePage() {
  redirect(SALES_PAGE);
}
