import type { WorksheetType } from '~/types/worksheet'

interface IntroStep {
  icon: string
  text: { en: string, id: string }
}

interface IntroDefinition {
  goal: { en: string, id: string }
  /** Concrete winning condition. Shown as a green "How to win" panel. */
  win: { en: string, id: string }
  steps: IntroStep[]
  voiceTips: { en: string[], id: string[] }
}

/**
 * Per-type instructions shown to teachers + kids before they start.
 * Each entry has a Goal, a How-to-win line, numbered steps, and example
 * voice phrases. Kept short and action-first.
 */
const INTROS: Record<WorksheetType, IntroDefinition> = {
  color: {
    goal: {
      en: 'Name the color you see.',
      id: 'Sebutkan warna yang kamu lihat.',
    },
    win: {
      en: 'Say or tap the correct color for every shape to finish the round.',
      id: 'Sebutkan atau sentuh warna yang benar untuk semua bentuk supaya menang.',
    },
    steps: [
      {
        icon: '👀',
        text: {
          en: 'Look at the colored shape on screen.',
          id: 'Lihat bentuk berwarna di layar.',
        },
      },
      {
        icon: '🎤',
        text: {
          en: 'Tap the mic and say the color out loud.',
          id: 'Tekan mikrofon dan ucapkan warnanya.',
        },
      },
      {
        icon: '👆',
        text: {
          en: 'Or tap one of the color buttons below.',
          id: 'Atau sentuh tombol warna di bawah.',
        },
      },
    ],
    voiceTips: {
      en: ['"red"', '"blue"', '"yellow"'],
      id: ['"merah"', '"biru"', '"kuning"'],
    },
  },
  sequence: {
    goal: {
      en: 'Sort the items by the rule shown above the slots.',
      id: 'Urutkan benda sesuai aturan yang tertulis di atas kotak.',
    },
    win: {
      en: 'Fill every slot in the order the rule asks for. The slots turn green when correct.',
      id: 'Isi semua kotak sesuai aturan. Kotak akan hijau kalau benar.',
    },
    steps: [
      {
        icon: '📜',
        text: {
          en: 'Read the rule (e.g. "smallest to largest").',
          id: 'Baca aturannya (misal "dari yang terkecil ke yang terbesar").',
        },
      },
      {
        icon: '🔢',
        text: {
          en: 'Look at the empty slots — they show the order.',
          id: 'Perhatikan kotak kosong — itu urutannya.',
        },
      },
      {
        icon: '🎤',
        text: {
          en: 'Say or tap the FIRST item, then the next, then the next.',
          id: 'Ucapkan atau sentuh benda PERTAMA, lalu berikutnya, lalu berikutnya.',
        },
      },
      {
        icon: '✅',
        text: {
          en: 'Wrong items shake red. Just try the correct one.',
          id: 'Salah pilih akan bergetar merah. Coba lagi yang benar.',
        },
      },
    ],
    voiceTips: {
      en: ['"ant"', '"elephant"', '"sunrise"'],
      id: ['"semut"', '"gajah"', '"matahari terbit"'],
    },
  },
  move: {
    goal: {
      en: 'Land the bunny exactly on the carrot tile.',
      id: 'Berhentikan kelinci tepat di kotak wortel.',
    },
    win: {
      en: 'Step right the right number of times. Going past the carrot is a miss — say "left" to step back.',
      id: 'Sebut "kanan" sejumlah kotak yang dibutuhkan. Kelebihan = belum menang. Sebut "kiri" untuk mundur.',
    },
    steps: [
      {
        icon: '🥕',
        text: {
          en: 'See where the carrot is on the track.',
          id: 'Lihat posisi wortel di jalur.',
        },
      },
      {
        icon: '🎤',
        text: {
          en: 'Say "right" or tap → to step forward.',
          id: 'Sebut "kanan" atau tekan → untuk maju satu kotak.',
        },
      },
      {
        icon: '🐰',
        text: {
          en: 'Bunny lands on carrot? You win this round.',
          id: 'Kelinci di wortel? Ronde ini menang.',
        },
      },
      {
        icon: '↩️',
        text: {
          en: 'Went too far? Say "left" or tap ← to step back.',
          id: 'Kelebihan? Sebut "kiri" atau tekan ← untuk mundur.',
        },
      },
    ],
    voiceTips: {
      en: ['"right"', '"left"', '"forward"'],
      id: ['"kanan"', '"kiri"', '"maju"'],
    },
  },
  maze: {
    goal: {
      en: 'Step the bunny through the maze to the carrot.',
      id: 'Pindahkan kelinci melewati labirin sampai ke wortel.',
    },
    win: {
      en: 'Land on the carrot tile. Each command moves the bunny one cell.',
      id: 'Sampai di kotak wortel. Setiap perintah menggerakkan kelinci satu kotak.',
    },
    steps: [
      {
        icon: '🗺️',
        text: {
          en: 'Look at where the bunny starts (🏠) and where the carrot is (🥕).',
          id: 'Lihat tempat awal kelinci (🏠) dan letak wortel (🥕).',
        },
      },
      {
        icon: '🎤',
        text: {
          en: 'Say "up", "right", "down", or "left" — bunny moves one tile.',
          id: 'Sebut "atas", "kanan", "bawah", atau "kiri" — kelinci bergerak satu kotak.',
        },
      },
      {
        icon: '👆',
        text: {
          en: 'Or tap the arrow pad. Same effect.',
          id: 'Atau tekan tombol panah. Efeknya sama.',
        },
      },
      {
        icon: '🚧',
        text: {
          en: 'Dark tiles are walls. The bunny stops when it bumps into one.',
          id: 'Kotak hitam adalah dinding. Kelinci berhenti jika tertabrak.',
        },
      },
      {
        icon: '🔄',
        text: {
          en: 'Stuck? Say "reset" to teleport the bunny back home.',
          id: 'Buntu? Sebut "ulang" untuk kembali ke awal.',
        },
      },
    ],
    voiceTips: {
      en: ['"up"', '"right"', '"down"', '"left"', '"reset"'],
      id: ['"atas"', '"kanan"', '"bawah"', '"kiri"', '"ulang"'],
    },
  },
  loop: {
    goal: {
      en: 'Build a loop that makes the same dance as the target.',
      id: 'Bangun loop yang menghasilkan tarian yang sama dengan target.',
    },
    win: {
      en: 'Your expanded moves must match the target exactly — same moves, same order, same total length.',
      id: 'Hasil loop kamu harus persis sama dengan target — gerakan, urutan, dan jumlah harus sama.',
    },
    steps: [
      {
        icon: '🎯',
        text: {
          en: 'Watch the Target dance play once. Tap "Watch the dance" to see it again.',
          id: 'Tonton tarian Target main sekali. Tekan "Tonton tarian" untuk ulang.',
        },
      },
      {
        icon: '➕',
        text: {
          en: 'Add moves to the loop body so it matches one repetition of the target.',
          id: 'Tambah gerakan ke loop supaya sama dengan satu putaran target.',
        },
      },
      {
        icon: '🔁',
        text: {
          en: 'Use +/− or say a number ("three") to set how many times the loop repeats.',
          id: 'Pakai +/− atau sebut angka ("tiga") untuk jumlah ulang.',
        },
      },
      {
        icon: '👀',
        text: {
          en: 'Check "Your loop becomes" — that\'s what will play.',
          id: 'Periksa "Hasil loop kamu" — itu yang akan dimainkan.',
        },
      },
      {
        icon: '▶️',
        text: {
          en: 'Say "go" or tap Go. Match the target exactly to win.',
          id: 'Sebut "jalan" atau tekan Jalan. Cocok dengan target = menang.',
        },
      },
    ],
    voiceTips: {
      en: ['"clap"', '"jump"', '"three"', '"go"', '"watch"'],
      id: ['"tepuk"', '"lompat"', '"tiga"', '"jalan"', '"lihat"'],
    },
  },
}

export function useIntro(type: WorksheetType) {
  const def = INTROS[type]
  const locale = useLocale()

  const goal = computed(() => def.goal[locale.value])
  const win = computed(() => def.win[locale.value])
  const steps = computed(() => def.steps.map(s => ({
    icon: s.icon,
    text: s.text[locale.value],
  })))
  const tips = computed(() => def.voiceTips[locale.value as 'en' | 'id'])

  return { goal, win, steps, tips }
}

export type { IntroStep, IntroDefinition }
