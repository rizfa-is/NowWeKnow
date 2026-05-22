import type { Locale, WorksheetType } from '~/types/worksheet'

interface IntroStep {
  icon: string
  text: { en: string, id: string }
}

interface IntroDefinition {
  goal: { en: string, id: string }
  steps: IntroStep[]
  voiceTips: { en: string[], id: string[] }
}

/**
 * Per-type instructions shown to teachers + kids before they start.
 * Kept short, action-first, with example voice phrases.
 */
const INTROS: Record<WorksheetType, IntroDefinition> = {
  color: {
    goal: {
      en: 'Name the color you see.',
      id: 'Sebutkan warna yang kamu lihat.',
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
      en: 'Put the items in the right order.',
      id: 'Susun benda sesuai urutan yang benar.',
    },
    steps: [
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
          en: 'Say or tap each item, starting with "first".',
          id: 'Ucapkan atau sentuh tiap benda, mulai dari yang pertama.',
        },
      },
      {
        icon: '✅',
        text: {
          en: 'Fill every slot to finish the round.',
          id: 'Isi semua kotak untuk menyelesaikan ronde.',
        },
      },
    ],
    voiceTips: {
      en: ['"apple"', '"banana"', '"grapes"'],
      id: ['"apel"', '"pisang"', '"anggur"'],
    },
  },
  move: {
    goal: {
      en: 'Move the bunny to the carrot.',
      id: 'Pindahkan kelinci sampai ke wortel.',
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
          en: 'Say "right" to step forward, or tap the → button.',
          id: 'Ucapkan "kanan" untuk maju, atau sentuh tombol →.',
        },
      },
      {
        icon: '🐰',
        text: {
          en: 'Land exactly on the carrot to win.',
          id: 'Berhenti tepat di wortel untuk menang.',
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
      en: 'Plan a path. Then run it.',
      id: 'Susun rencana jalan. Lalu jalankan.',
    },
    steps: [
      {
        icon: '🗺️',
        text: {
          en: 'Look at where the bunny starts and where the carrot is.',
          id: 'Lihat dari mana kelinci mulai dan di mana wortelnya.',
        },
      },
      {
        icon: '🎤',
        text: {
          en: 'Add steps by saying "up", "right", "down", or "left".',
          id: 'Tambah langkah dengan suara "atas", "kanan", "bawah", atau "kiri".',
        },
      },
      {
        icon: '▶️',
        text: {
          en: 'Say "go" or tap Go to run your plan.',
          id: 'Ucapkan "jalan" atau tekan Jalan untuk menjalankan rencana.',
        },
      },
      {
        icon: '🔄',
        text: {
          en: 'Hit a wall? Say "reset" and try again.',
          id: 'Kena dinding? Ucapkan "ulang" dan coba lagi.',
        },
      },
    ],
    voiceTips: {
      en: ['"up"', '"right"', '"go"', '"reset"'],
      id: ['"atas"', '"kanan"', '"jalan"', '"ulang"'],
    },
  },
  loop: {
    goal: {
      en: 'Build a loop that matches the dance.',
      id: 'Bangun loop yang sesuai dengan tarian.',
    },
    steps: [
      {
        icon: '💃',
        text: {
          en: 'Read the goal: which moves repeat how many times?',
          id: 'Pahami target: gerakan apa, diulang berapa kali?',
        },
      },
      {
        icon: '➕',
        text: {
          en: 'Say or tap each move to add it inside the loop body.',
          id: 'Ucapkan atau sentuh tiap gerakan untuk menambah ke loop.',
        },
      },
      {
        icon: '🔁',
        text: {
          en: 'Say a number ("three") or tap +/− to set how many times.',
          id: 'Ucapkan angka ("tiga") atau tekan +/− untuk jumlah ulang.',
        },
      },
      {
        icon: '▶️',
        text: {
          en: 'Say "go" to play. The preview shows what unfolds.',
          id: 'Ucapkan "jalan" untuk memainkan. Pratinjau di bawah.',
        },
      },
    ],
    voiceTips: {
      en: ['"clap"', '"jump"', '"three"', '"go"'],
      id: ['"tepuk"', '"lompat"', '"tiga"', '"jalan"'],
    },
  },
}

export function useIntro(type: WorksheetType) {
  const def = INTROS[type]
  const locale = useLocale()

  const goal = computed(() => def.goal[locale.value])
  const steps = computed(() => def.steps.map(s => ({
    icon: s.icon,
    text: s.text[locale.value],
  })))
  const tips = computed(() => def.voiceTips[locale.value as 'en' | 'id'])

  return { goal, steps, tips }
}

export type { IntroStep, IntroDefinition }
