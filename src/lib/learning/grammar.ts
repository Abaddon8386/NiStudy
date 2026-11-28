import type { GrammarCardDetails } from "@/lib/domain/queue";
import { createClient } from "@/lib/supabase/client";

export type GrammarLevel = "N5" | "N4";

/** Một điểm ngữ pháp trong danh sách (chưa có phần giải thích). */
export interface GrammarListItem {
  cardId: string;
  pointId: string;
  level: GrammarLevel;
  sort: number;
  title: string;
  pattern: string;
  meaning_vi: string;
}

/** Đủ chi tiết một điểm ngữ pháp, cho trang bài học. */
export interface GrammarDetails extends GrammarListItem {
  explanation: GrammarCardDetails["explanation"];
  notes: GrammarCardDetails["notes"];
  examples: GrammarCardDetails["examples"];
  exercises: GrammarCardDetails["exercises"];
}

interface ListRow {
  card_id: string;
  point_id: string;
  level: GrammarLevel;
  sort: number;
  title: string;
  pattern: string;
  meaning_vi: string;
}

type DetailRow = ListRow & Pick<GrammarCardDetails, "explanation" | "notes" | "examples" | "exercises">;

const LIST_COLUMNS = "card_id,point_id,level,sort,title,pattern,meaning_vi";
const DETAIL_COLUMNS = `${LIST_COLUMNS},explanation,notes,examples,exercises`;
// `cards!inner` + eq("cards.published", true): chỉ lấy điểm đã published (RLS cho đọc cả nháp).
const PUBLISHED = "cards!inner(published)";

const toListItem = (r: ListRow): GrammarListItem => ({
  cardId: r.card_id,
  pointId: r.point_id,
  level: r.level,
  sort: r.sort,
  title: r.title,
  pattern: r.pattern,
  meaning_vi: r.meaning_vi,
});

/** Danh sách điểm ngữ pháp đã published, theo level rồi sort. Lỗi mạng/truy vấn: ném Error. */
export async function listGrammar(level?: GrammarLevel): Promise<GrammarListItem[]> {
  let q = createClient()
    .from("grammar_details")
    .select(`${LIST_COLUMNS},${PUBLISHED}`)
    .eq("cards.published", true);
  if (level) q = q.eq("level", level);
  const { data, error } = await q.order("level").order("sort").order("card_id");
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ListRow[]).map(toListItem);
}

/** Chi tiết một điểm theo `point_id`; null nếu không có hoặc chưa published. */
export async function getGrammar(pointId: string): Promise<GrammarDetails | null> {
  const { data, error } = await createClient()
    .from("grammar_details")
    .select(`${DETAIL_COLUMNS},${PUBLISHED}`)
    .eq("cards.published", true)
    .eq("point_id", pointId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const r = data as unknown as DetailRow;
  return { ...toListItem(r), explanation: r.explanation, notes: r.notes, examples: r.examples, exercises: r.exercises };
}

/** `card_id` các thẻ ngữ pháp người dùng đã có trạng thái ôn (RLS chỉ trả hàng của chính họ). */
export async function learnedGrammarIds(): Promise<Set<string>> {
  const { data, error } = await createClient().from("card_states").select("card_id").like("card_id", "grammar:%");
  if (error) throw new Error(error.message);
  return new Set(((data ?? []) as { card_id: string }[]).map((r) => r.card_id));
}
