import { POST_TYPE_LABEL, type FeedPost, type PostType } from "@/app/_data/mock";
import { CommentIcon, HeartIcon, MegaphoneIcon } from "@/components/shared/icons";
import { PhotoPlaceholder } from "@/components/home/PhotoPlaceholder";

const BADGE_STYLES: Record<PostType, { pill: string; label: string; dot: string }> = {
  achievement: { pill: "bg-[#CFEBD8]", label: "text-achievement", dot: "bg-achievement" },
  activity: { pill: "bg-[#C7E7F1]", label: "text-staff", dot: "bg-staff" },
  announcement: { pill: "bg-[#CCD8F4]", label: "text-announcement", dot: "bg-announcement" },
};

export function PostCard({ post }: { post: FeedPost }) {
  const badge = BADGE_STYLES[post.type];

  return (
    <article className="rounded-[20px] border border-[#ECE0D0] bg-[#FFFDF9] px-[22px] py-5 shadow-[0_4px_16px_-12px_rgba(120,90,60,.5)]">
      <div className="mb-[14px] flex items-center gap-3">
        <span
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full font-display text-[17px] font-semibold"
          style={{ backgroundColor: post.avatarBg, color: post.avatarColor }}
        >
          {post.avatarIcon === "megaphone" ? (
            <MegaphoneIcon size={20} />
          ) : (
            post.authorInitial
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[16.5px] font-semibold text-foreground">
            {post.authorName}
          </span>
          <span className="block text-[12.5px] text-[#A89A8B]">
            {post.time}
            {post.publishedByMe && " · publicado por vos"}
          </span>
        </span>
        <span
          className={`flex items-center gap-[7px] rounded-full px-3 py-1.5 ${badge.pill}`}
        >
          <span className={`h-2 w-2 rounded-full ${badge.dot}`} />
          <span className={`text-[12px] font-extrabold tracking-[.5px] ${badge.label}`}>
            {POST_TYPE_LABEL[post.type]}
          </span>
        </span>
      </div>

      <div className="mb-[10px] text-[12.5px] text-[#A89A8B]">
        Para: {post.audience}
      </div>

      <p className="m-0 text-[15.5px] leading-[1.55] text-[#4A4038]">
        {post.text}
      </p>

      {post.photoPlaceholder && (
        <PhotoPlaceholder label={post.photoPlaceholder.label} />
      )}

      <div className="mt-4 flex items-center gap-[18px] border-t border-[#F0E6D8] pt-[14px]">
        <span className="flex items-center gap-[7px] text-[14px] font-bold text-[#E0654A]">
          <HeartIcon size={19} />
          {post.hearts}
        </span>
        <a
          href="#"
          className="flex items-center gap-[7px] text-[14px] font-bold text-[#94887B]"
        >
          <CommentIcon size={18} />
          {post.comments}
        </a>
        <span className="flex-1" />
        <a href="#" className="text-[14px] font-extrabold text-[#C5503A]">
          Editar
        </a>
      </div>
    </article>
  );
}
