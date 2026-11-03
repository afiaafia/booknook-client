'use client';

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import Image from 'next/image';
import { Camera, LoaderCircle, Save, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

import { authClient } from '@/lib/auth-client';
import { uploadBookImage } from '@/lib/api';
import {
  saveReadingPreferences,
  type ReadingPreferences,
} from '@/lib/reading-preferences';

interface EditorUser {
  id: string;
  name: string;
  image?: string | null;
}

function addDraft(values: string[], draft: string): string[] {
  const value = draft.trim().replace(/,$/, '');
  if (
    !value ||
    values.some(
      (item) => item.toLocaleLowerCase() === value.toLocaleLowerCase()
    )
  ) {
    return values;
  }
  return [...values, value].slice(0, 20);
}

function TagInput({
  label,
  values,
  onChange,
  draft,
  onDraftChange,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  draft: string;
  onDraftChange: (value: string) => void;
  placeholder: string;
}) {
  function addTag() {
    const value = draft.trim().replace(/,$/, '');
    if (!value) return;
    if (
      !values.some(
        (item) => item.toLocaleLowerCase() === value.toLocaleLowerCase()
      )
    ) {
      onChange([...values, value].slice(0, 20));
    }
    onDraftChange('');
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      addTag();
    }
    if (event.key === 'Backspace' && !draft && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <div>
      <label className="reading-editor-label" htmlFor={`reading-pref-${label}`}>
        {label}
      </label>
      <div className="reading-editor-tag-field">
        {values.map((value) => (
          <span key={value} className="reading-editor-tag">
            {value}
            <button
              type="button"
              onClick={() => onChange(values.filter((item) => item !== value))}
              aria-label={`Remove ${value}`}
            >
              <X size={13} aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          id={`reading-pref-${label}`}
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={placeholder}
          className="min-w-[10rem] flex-1 bg-transparent px-2 py-2 text-sm text-foreground outline-none placeholder:text-muted"
        />
      </div>
      <p className="mt-1 text-right text-xs text-muted">Press Enter to add</p>
    </div>
  );
}

export default function ReadingProfileEditor({
  user,
  preferences,
  onClose,
}: {
  user: EditorUser;
  preferences: ReadingPreferences;
  onClose: () => void;
}) {
  const [name, setName] = useState(user.name);
  const [image, setImage] = useState<string | null>(user.image ?? null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [bio, setBio] = useState(preferences.bio);
  const [motto, setMotto] = useState(preferences.motto);
  const [interests, setInterests] = useState(preferences.interests);
  const [favoriteGenres, setFavoriteGenres] = useState(
    preferences.favoriteGenres
  );
  const [favoriteAuthors, setFavoriteAuthors] = useState(
    preferences.favoriteAuthors
  );
  const [tagDrafts, setTagDrafts] = useState({
    interests: '',
    favoriteGenres: '',
    favoriteAuthors: '',
  });
  const [avatarError, setAvatarError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    };
  }, []);

  useEffect(() => {
    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape' && !isSaving) {
        event.preventDefault();
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isSaving, onClose]);

  function chooseImage(file: File | undefined) {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFormError('Choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size === 0 || file.size > 500_000) {
      setFormError('Choose an image no larger than 500 KB.');
      return;
    }

    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = URL.createObjectURL(file);
    setPreviewSrc(previewRef.current);
    setImageFile(file);
    setAvatarError(false);
    setFormError(null);
  }

  function removeImage() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = null;
    setPreviewSrc(null);
    setImageFile(null);
    setImage(null);
    setAvatarError(false);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setFormError('Add a display name before saving.');
      nameInputRef.current?.focus();
      return;
    }

    setIsSaving(true);
    setFormError(null);
    try {
      let nextImage = image;
      if (imageFile) {
        setUploadProgress(0);
        nextImage = await uploadBookImage(imageFile, setUploadProgress);
      }

      const updates: { name?: string; image?: string | null } = {};
      const nextName = name.trim();
      if (nextName !== user.name) updates.name = nextName;
      if (nextImage !== (user.image ?? null)) updates.image = nextImage;

      if (Object.keys(updates).length > 0) {
        await authClient.$fetch('/update-user', {
          method: 'POST',
          body: updates,
          throw: true,
        });
      }

      saveReadingPreferences(user.id, {
        bio: bio.trim(),
        motto: motto.trim(),
        interests: addDraft(interests, tagDrafts.interests),
        favoriteGenres: addDraft(favoriteGenres, tagDrafts.favoriteGenres),
        favoriteAuthors: addDraft(favoriteAuthors, tagDrafts.favoriteAuthors),
      });
      toast.success('Your reading corner has been updated.');
      onClose();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Your profile could not be saved.';
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  }

  function keepTabInside(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      if (!isSaving) onClose();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      )
    );
    const first = focusable[0];
    const last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first && last) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last && first) {
      event.preventDefault();
      first.focus();
    }
  }

  const displayedImage = previewSrc ?? image;

  return (
    <div
      className="reading-editor-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="reading-editor-title"
        aria-describedby="reading-editor-description"
        className="reading-editor-sheet"
        onKeyDown={keepTabInside}
      >
        <form onSubmit={handleSubmit}>
          <header className="reading-editor-header">
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-secondary-accent">
                Your page, your story
              </p>
              <h2
                id="reading-editor-title"
                className="mt-1 font-serif text-3xl text-foreground sm:text-4xl"
              >
                Edit your reading corner
              </h2>
              <p
                id="reading-editor-description"
                className="mt-2 text-sm text-muted"
              >
                Account name and portrait update your BookNook profile. Reading
                notes stay on this device.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              aria-label="Close profile editor"
              className="reading-editor-close"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>

          <div className="reading-editor-content">
            <section aria-labelledby="personal-information-title">
              <h3
                id="personal-information-title"
                className="reading-editor-section-title"
              >
                Personal Information
              </h3>

              <div className="reading-editor-avatar-row">
                <div className="reading-editor-avatar">
                  {displayedImage && !avatarError ? (
                    <Image
                      src={displayedImage}
                      alt="Profile image preview"
                      fill
                      unoptimized
                      className="object-cover"
                      onError={() => setAvatarError(true)}
                    />
                  ) : (
                    <span aria-label={`${name || 'Reader'} initials`}>
                      {name
                        .trim()
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part) => part[0]?.toLocaleUpperCase())
                        .join('') || 'R'}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <label
                    htmlFor="reading-corner-image"
                    className="reading-editor-secondary-button"
                  >
                    <Camera size={15} aria-hidden="true" /> Choose image
                  </label>
                  <input
                    id="reading-corner-image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) =>
                      chooseImage(event.currentTarget.files?.[0])
                    }
                  />
                  {(image || imageFile) && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="reading-editor-text-button"
                    >
                      <Trash2 size={14} aria-hidden="true" /> Remove image
                    </button>
                  )}
                </div>
              </div>

              <label
                className="reading-editor-label"
                htmlFor="reading-corner-name"
              >
                Display name
              </label>
              <input
                ref={nameInputRef}
                id="reading-corner-name"
                value={name}
                onChange={(event) => setName(event.target.value.slice(0, 80))}
                maxLength={80}
                required
                className="reading-editor-input"
              />
              <p className="reading-editor-character-count">{name.length}/80</p>

              <label
                className="reading-editor-label"
                htmlFor="reading-corner-bio"
              >
                Biography
              </label>
              <textarea
                id="reading-corner-bio"
                value={bio}
                onChange={(event) => setBio(event.target.value.slice(0, 320))}
                maxLength={320}
                rows={3}
                placeholder="A few words about what you love to read���"
                className="reading-editor-input reading-editor-textarea"
              />
              <p className="reading-editor-character-count">{bio.length}/320</p>

              <label
                className="reading-editor-label"
                htmlFor="reading-corner-motto"
              >
                Favorite quote or motto
              </label>
              <textarea
                id="reading-corner-motto"
                value={motto}
                onChange={(event) => setMotto(event.target.value.slice(0, 120))}
                maxLength={120}
                rows={2}
                placeholder="A line you like to return to���"
                className="reading-editor-input reading-editor-textarea"
              />
              <p className="reading-editor-character-count">
                {motto.length}/120
              </p>
            </section>

            <section
              aria-labelledby="reading-identity-title"
              className="mt-8 border-t border-border pt-7"
            >
              <h3
                id="reading-identity-title"
                className="reading-editor-section-title"
              >
                Reading Identity
              </h3>
              <div className="space-y-5">
                <TagInput
                  label="Hobbies and interests"
                  values={interests}
                  onChange={setInterests}
                  draft={tagDrafts.interests}
                  onDraftChange={(value) =>
                    setTagDrafts((current) => ({
                      ...current,
                      interests: value,
                    }))
                  }
                  placeholder="Add an interest"
                />
                <TagInput
                  label="Favorite genres"
                  values={favoriteGenres}
                  onChange={setFavoriteGenres}
                  draft={tagDrafts.favoriteGenres}
                  onDraftChange={(value) =>
                    setTagDrafts((current) => ({
                      ...current,
                      favoriteGenres: value,
                    }))
                  }
                  placeholder="Add a genre"
                />
                <TagInput
                  label="Favorite authors"
                  values={favoriteAuthors}
                  onChange={setFavoriteAuthors}
                  draft={tagDrafts.favoriteAuthors}
                  onDraftChange={(value) =>
                    setTagDrafts((current) => ({
                      ...current,
                      favoriteAuthors: value,
                    }))
                  }
                  placeholder="Add an author"
                />
              </div>
            </section>

            {formError && (
              <p role="alert" className="reading-editor-error mt-6">
                {formError}
              </p>
            )}
          </div>

          <footer className="reading-editor-footer">
            {uploadProgress !== null && (
              <p className="mr-auto text-xs text-muted" aria-live="polite">
                Uploading portrait �� {uploadProgress}%
              </p>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="reading-editor-secondary-button"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="reading-editor-primary-button"
            >
              {isSaving ? (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Save size={15} aria-hidden="true" />
              )}
              {isSaving ? 'Saving' : 'Save changes'}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
