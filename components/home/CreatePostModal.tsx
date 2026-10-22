"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPost, type CreatePostState } from "@/app/actions";
import { POST_TYPE_ORDER, type PostType } from "@/app/_data/mock";
import { useFeed } from "@/components/home/FeedContext";
import { CloseIcon, PlusIcon } from "@/components/shared/icons";
import { createClient } from "@/utils/supabase/client";

const SECTION_LABEL_CLASS =
  "mb-[10px] text-[12px] font-extrabold tracking-[.7px] text-[#94887B]";

const TYPE_PILL_LABEL: Record<PostType, string> = {
  meal: "Comida",
  nap: "Siesta",
  activity: "Actividad",
  achievement: "Logro",
  mood: "Ánimo",
  photo: "Foto",
  announcement: "Anuncio",
};

const TYPE_PILL_COLOR: Record<PostType, { bg: string; fg: string }> = {
  meal: { bg: "#9A7B1E", fg: "#FFFFFF" },
  nap: { bg: "#E7DCF6", fg: "#7B5FC0" },
  activity: { bg: "#2E89A6", fg: "#FFFFFF" },
  achievement: { bg: "#CFEBD8", fg: "#3E9B6C" },
  mood: { bg: "#F9D2DE", fg: "#C56486" },
  photo: { bg: "#FBD8CC", fg: "#D9684A" },
  announcement: { bg: "#CCD8F4", fg: "#4E72C8" },
};

const AVATAR_PALETTE: ReadonlyArray<readonly [string, string]> = [
  ["#A9D9E8", "#1F7A93"],
  ["#F4B8CC", "#C44A7A"],
  ["#B9DEC4", "#3E8B62"],
  ["#C9B6E8", "#7B5FC0"],
  ["#F4DC8E", "#9A7B1E"],
];

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_SIZE_ERROR = "Cada foto debe pesar menos de 5 MB";
const PHOTO_TYPE_ERROR = "Solo se pueden adjuntar imágenes";
const PHOTO_COUNT_ERROR = "Máximo 5 fotos";
const PHOTO_CONSENT_ERROR =
  "Hay niños sin consentimiento de fotos en la audiencia. Quitá las fotos o publicalas sin ellas.";

interface CreatePostErrors {
  audience?: boolean;
  type?: boolean;
  description?: boolean;
  photos?: string;
}

interface RoomOption {
  id: string;
  name: string;
}

interface ChildOption {
  id: string;
  full_name: string;
  room_id: string | null;
  photo_consent: boolean;
}

interface PhotoEntry {
  file: File;
  previewUrl: string;
}

const initialState: CreatePostState = {};

function textareaClass(hasError: boolean): string {
  return [
    "min-h-[120px] w-full resize-y rounded-[14px] border-[1.5px] bg-white px-4 py-[14px] text-[15px] leading-normal text-foreground outline-none placeholder:text-[#B6A99B]",
    hasError ? "border-[#D9583C]" : "border-[#EADFD0]",
  ].join(" ");
}

function ErrorMessage() {
  return (
    <p className="mt-1.5 text-[12.5px] font-bold text-[#D9583C]">
      Este campo es obligatorio
    </p>
  );
}

export function CreatePostModal() {
  const { isCreateOpen, closeCreate } = useFeed();

  if (!isCreateOpen) return null;

  return <CreatePostDialog onClose={closeCreate} />;
}

function CreatePostDialog({ onClose }: { onClose: () => void }) {
  const [selectedKidIds, setSelectedKidIds] = useState<string[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [type, setType] = useState<PostType | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<CreatePostErrors>({});
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);
  const [rooms, setRooms] = useState<RoomOption[]>([]);
  const [kids, setKids] = useState<ChildOption[]>([]);
  const [state, formAction, pending] = useActionState(
    createPost,
    initialState,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("rooms")
      .select("id, name")
      .order("created_at", { ascending: true })
      .then(({ data }) => {
        setRooms((data ?? []) as RoomOption[]);
      });
    supabase
      .from("children")
      .select("id, full_name, room_id, photo_consent")
      .eq("status", "active")
      .order("full_name", { ascending: true })
      .then(({ data }) => {
        setKids((data ?? []) as ChildOption[]);
      });
  }, []);

  function dismiss() {
    photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
    onClose();
  }

  useEffect(() => {
    if (state.success) {
      photos.forEach((photo) => URL.revokeObjectURL(photo.previewUrl));
      onClose();
    }
  });

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") dismiss();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const list = Array.from(files);

    if (photos.length + list.length > MAX_PHOTOS) {
      setErrors((prev) => ({ ...prev, photos: PHOTO_COUNT_ERROR }));
      event.target.value = "";
      return;
    }
    for (const file of list) {
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, photos: PHOTO_TYPE_ERROR }));
        event.target.value = "";
        return;
      }
      if (file.size > MAX_PHOTO_BYTES) {
        setErrors((prev) => ({ ...prev, photos: PHOTO_SIZE_ERROR }));
        event.target.value = "";
        return;
      }
    }

    setErrors((prev) => ({ ...prev, photos: undefined }));
    const entries = list.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...entries]);
    event.target.value = "";
  }

  function removePhoto(previewUrl: string) {
    URL.revokeObjectURL(previewUrl);
    setPhotos((prev) => prev.filter((photo) => photo.previewUrl !== previewUrl));
    setErrors((prev) => ({ ...prev, photos: undefined }));
  }

  function toggleRoom(roomId: string) {
    if (selectedRoomId === roomId) {
      setSelectedRoomId(null);
      return;
    }
    setSelectedRoomId(roomId);
    setSelectedKidIds([]);
  }

  function toggleKid(kidId: string) {
    if (selectedRoomId) {
      setSelectedRoomId(null);
      setSelectedKidIds([kidId]);
      return;
    }
    setSelectedKidIds((prev) =>
      prev.includes(kidId)
        ? prev.filter((id) => id !== kidId)
        : [...prev, kidId],
    );
  }

  function audienceHasBlockedConsent(): boolean {
    if (selectedRoomId) {
      return kids.some(
        (kid) => kid.room_id === selectedRoomId && !kid.photo_consent,
      );
    }
    const selected = new Set(selectedKidIds);
    return kids.some((kid) => selected.has(kid.id) && !kid.photo_consent);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: CreatePostErrors = {
      audience: !selectedRoomId && selectedKidIds.length === 0,
      type: !type,
      description: !description.trim(),
    };
    setErrors(next);
    if (next.audience || next.type || next.description || type === null) {
      return;
    }
    if (photos.length > 0 && audienceHasBlockedConsent()) {
      setErrors({ ...next, photos: PHOTO_CONSENT_ERROR });
      return;
    }
    const formData = new FormData();
    formData.set("type", type);
    formData.set("body", description.trim());
    formData.set("title", title.trim());
    formData.set("audienceMode", selectedRoomId ? "room" : "kids");
    if (selectedRoomId) formData.set("roomId", selectedRoomId);
    for (const kidId of selectedKidIds) {
      formData.append("kidIds", kidId);
    }
    for (const photo of photos) {
      formData.append("photos", photo.file);
    }
    formAction(formData);
  }

  function pillClass(selected: boolean): string {
    return [
      "flex cursor-pointer items-center gap-2 rounded-full border-[1.5px] text-[14px] font-bold",
      selected
        ? "border-[#3F362E] bg-[#3F362E] text-white"
        : "border-[#ECE0D0] bg-[#FFFDF9] text-[#6E6359]",
    ].join(" ");
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Nueva publicación"
        onSubmit={handleSubmit}
        className="my-auto max-h-[calc(100dvh_-_32px)] w-full max-w-[580px] overflow-y-auto overflow-x-hidden rounded-[24px] border border-[#ECE0D0] bg-[#FBF4EC] shadow-[0_20px_50px_-24px_rgba(63,54,46,.35)] sm:max-h-[calc(100dvh_-_48px)]"
      >
        <div className="flex items-center justify-between border-b border-[#ECE0D0] px-[26px] py-5">
          <button
            type="button"
            onClick={dismiss}
            className="cursor-pointer text-[15px] font-bold text-[#94887B]"
          >
            Cancelar
          </button>
          <span className="font-display text-[18px] font-semibold text-foreground">
            Nueva publicación
          </span>
          <button
            type="submit"
            disabled={pending}
            className="cursor-pointer text-[15px] font-extrabold text-[#D9583C] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Publicar
          </button>
        </div>

        <div className="p-[26px] pt-6">
          <div className="mb-[22px]">
            <div className={SECTION_LABEL_CLASS}>PARA</div>
            <div className="flex flex-wrap gap-[9px]">
              {rooms.map((room) => {
                const selected = selectedRoomId === room.id;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => toggleRoom(room.id)}
                    className={`${pillClass(selected)} px-4 py-[6px]`}
                  >
                    Toda la sala · {room.name}
                  </button>
                );
              })}
              {kids.map((kid, index) => {
                const selected =
                  !selectedRoomId && selectedKidIds.includes(kid.id);
                const [avatarBg, avatarColor] =
                  AVATAR_PALETTE[index % AVATAR_PALETTE.length];
                const firstName = kid.full_name.split(" ")[0];
                return (
                  <button
                    key={kid.id}
                    type="button"
                    onClick={() => toggleKid(kid.id)}
                    className={`${pillClass(selected)} py-[6px] pl-[6px] pr-[14px]`}
                  >
                    <span
                      className="flex h-[26px] w-[26px] flex-none items-center justify-center rounded-full font-display text-[13px] font-semibold"
                      style={{
                        backgroundColor: avatarBg,
                        color: avatarColor,
                      }}
                    >
                      {kid.full_name.trim().charAt(0).toUpperCase()}
                    </span>
                    {firstName}
                  </button>
                );
              })}
            </div>
            {errors.audience && <ErrorMessage />}
          </div>

          <div className="mb-[22px]">
            <div className={SECTION_LABEL_CLASS}>TIPO</div>
            <div className="flex flex-wrap gap-[9px]">
              {POST_TYPE_ORDER.map((postType) => {
                const selected = type === postType;
                const color = TYPE_PILL_COLOR[postType];
                return (
                  <button
                    key={postType}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setType(postType)}
                    className={`cursor-pointer rounded-full px-4 py-2 text-[13.5px] font-extrabold ${
                      selected
                        ? "opacity-100 ring-2 ring-[#3F362E]"
                        : "opacity-50"
                    }`}
                    style={{
                      backgroundColor: color.bg,
                      color: color.fg,
                    }}
                  >
                    {TYPE_PILL_LABEL[postType]}
                  </button>
                );
              })}
            </div>
            {errors.type && <ErrorMessage />}
          </div>

          <div className="mb-[22px]">
            <div className={SECTION_LABEL_CLASS}>Título (opcional)</div>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Agregá un título…"
              className="w-full rounded-[14px] border-[1.5px] border-[#EADFD0] bg-white px-4 py-[12px] text-[15px] leading-normal text-foreground outline-none placeholder:text-[#B6A99B]"
            />
          </div>

          <div className="mb-[22px]">
            <div className={SECTION_LABEL_CLASS}>DESCRIPCIÓN</div>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Contá cómo le fue hoy…"
              className={textareaClass(errors.description ?? false)}
            />
            {errors.description && <ErrorMessage />}
          </div>

          <div>
            <div className={SECTION_LABEL_CLASS}>FOTOS</div>
            <div className="flex flex-wrap gap-3">
              {photos.map((photo) => (
                <div key={photo.previewUrl} className="relative h-24 w-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.previewUrl}
                    alt=""
                    className="h-24 w-24 rounded-[14px] object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.previewUrl)}
                    aria-label="Quitar foto"
                    className="absolute -right-2 -top-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#3F362E] text-white shadow-[0_4px_10px_-4px_rgba(63,54,46,.6)]"
                  >
                    <CloseIcon size={14} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-24 w-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-[14px] border-[1.5px] border-dashed border-[#DBCDBA] bg-[#F4ECE1] text-[#B0A290]"
              >
                <PlusIcon size={22} className="text-[#C5503A]" />
                <span className="text-[12px]">Agregar</span>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFiles}
            />
            {(errors.photos || state.error) && (
              <p className="mt-1.5 text-[12.5px] font-bold text-[#D9583C]">
                {errors.photos ?? state.error}
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
