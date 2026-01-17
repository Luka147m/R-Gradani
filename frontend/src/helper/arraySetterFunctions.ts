export const arrayAddFn =
  (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
  (value: string) => {
    setter((prev) => (prev.includes(value) ? prev : [...prev, value]));
  };

export const arrayRemoveFn =
  (setter: React.Dispatch<React.SetStateAction<string[]>>) =>
  (value: string) => {
    setter((prev) => prev.filter((v) => v !== value));
  };
