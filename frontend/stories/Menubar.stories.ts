import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarGroup,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar'
import {
  File,
  FolderOpen,
  Save,
  SaveAll,
  FileText,
  Copy,
  Clipboard,
  Scissors,
  Search,
  Replace,
  Undo,
  Redo,
  Settings,
  HelpCircle,
  Info,
  BookOpen,
  Keyboard,
  Bug,
  Github,
  Mail,
  MessageSquare,
  Phone,
  Users,
  User,
  UserPlus,
  LogOut,
  Home,
  Layout,
  Grid,
  List,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  RotateCcw,
  RefreshCw,
  Download,
  Upload,
  Share,
  Link,
  Calendar,
  Clock,
  Bell,
  Star,
  Heart,
  Bookmark,
  Tag,
  Filter,
  ArrowUp,
  ArrowDown,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  SkipBack,
  SkipForward,
  Sun,
  Moon,
  Monitor,
  Palette,
  Type,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List as ListIcon,
  Image,
  Video,
  Music,
  Camera,
  Mic,
  Headphones,
  Speaker,
  Wifi,
  WifiOff,
  Battery,
  Power,
  ShieldCheck,
  Lock,
  Unlock,
  Key,
  Database,
  Server,
  Cloud,
  CloudOff,
  HardDrive,
  Trash2,
  Archive,
  FolderPlus,
  FilePlus,
  Edit,
  PenTool,
  MousePointer,
  Move,
  MoreHorizontal,
  Check,
  X,
  Plus,
  Minus,
} from 'lucide-vue-next'

// Mock data for different menubar scenarios
const mockApplicationData = {
  recentFiles: [
    'Project Proposal.docx',
    'Budget 2024.xlsx',
    'Design Mockups.fig',
    'Meeting Notes.md',
    'User Research.pdf',
  ],
  preferences: {
    theme: ref('light'),
    fontSize: ref('medium'),
    autoSave: ref(true),
    spellCheck: ref(true),
    lineNumbers: ref(false),
    wordWrap: ref(true),
  },
  view: {
    sidebar: ref(true),
    toolbar: ref(true),
    statusBar: ref(true),
    minimap: ref(false),
    rulers: ref(false),
    grid: ref(false),
  },
  notifications: {
    desktop: ref(true),
    sound: ref(false),
    email: ref(true),
  },
}

const mockEditorData = {
  formatting: {
    bold: ref(false),
    italic: ref(false),
    underline: ref(false),
    alignment: ref('left'),
    fontSize: ref('12'),
    fontFamily: ref('Arial'),
  },
  tools: {
    spellCheck: ref(true),
    grammar: ref(true),
    readingMode: ref(false),
    focusMode: ref(false),
  },
}

const mockMediaPlayerData = {
  playback: {
    isPlaying: ref(false),
    shuffle: ref(false),
    repeat: ref('none'),
    volume: ref(75),
    muted: ref(false),
  },
  library: {
    showArtwork: ref(true),
    groupByAlbum: ref(false),
    showGenre: ref(true),
  },
}

const mockSystemData = {
  network: {
    wifi: ref(true),
    bluetooth: ref(false),
    hotspot: ref(false),
  },
  display: {
    brightness: ref(80),
    nightMode: ref(false),
    autoRotate: ref(true),
  },
  privacy: {
    locationServices: ref(true),
    analytics: ref(false),
    crashReports: ref(true),
  },
}

const meta = {
  title: 'UI Components/Menubar',
  component: Menubar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A horizontal menubar that provides access to application menus and commands. Built with Reka UI and supports keyboard navigation, submenus, checkboxes, radio groups, and shortcuts.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Menubar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => ({
    components: {
      Menubar,
      MenubarMenu,
      MenubarTrigger,
      MenubarContent,
      MenubarItem,
      MenubarSeparator,
      MenubarShortcut,
      File,
      Edit,
      Settings,
      HelpCircle,
    },
    template: `
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <File class="mr-2 h-4 w-4" />
              New File
              <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <FolderOpen class="mr-2 h-4 w-4" />
              Open...
              <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Save class="mr-2 h-4 w-4" />
              Save
              <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
        
        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Undo class="mr-2 h-4 w-4" />
              Undo
              <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Redo class="mr-2 h-4 w-4" />
              Redo
              <MenubarShortcut>⌘⇧Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Scissors class="mr-2 h-4 w-4" />
              Scissors
              <MenubarShortcut>⌘X</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Copy class="mr-2 h-4 w-4" />
              Copy
              <MenubarShortcut>⌘C</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Clipboard class="mr-2 h-4 w-4" />
              Clipboard
              <MenubarShortcut>⌘V</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <HelpCircle class="mr-2 h-4 w-4" />
              Help Center
            </MenubarItem>
            <MenubarItem>
              <Info class="mr-2 h-4 w-4" />
              About
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    `,
  }),
}

export const ApplicationMenu: Story = {
  render: () => ({
    components: {
      Menubar,
      MenubarMenu,
      MenubarTrigger,
      MenubarContent,
      MenubarItem,
      MenubarGroup,
      MenubarLabel,
      MenubarSeparator,
      MenubarShortcut,
      MenubarSub,
      MenubarSubTrigger,
      MenubarSubContent,
      File,
      FolderOpen,
      Save,
      SaveAll,
      FileText,
      Edit,
      Scissors,
      Copy,
      Clipboard,
      Search,
      Replace,
      Layout,
      Eye,
      ZoomIn,
      ZoomOut,
      Settings,
      HelpCircle,
      BookOpen,
      Keyboard,
      Bug,
      Github,
      Info,
      LogOut,
    },
    setup() {
      return { mockApplicationData }
    },
    template: `
      <Menubar class="border-b">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <File class="mr-2 h-4 w-4" />
              New File
              <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <FolderOpen class="mr-2 h-4 w-4" />
              Open Folder...
              <MenubarShortcut>⌘⇧O</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>
                <FileText class="mr-2 h-4 w-4" />
                Recent Files
              </MenubarSubTrigger>
              <MenubarSubContent class="w-64">
                <MenubarItem v-for="file in mockApplicationData.recentFiles" :key="file">
                  {{ file }}
                </MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarItem>
              <Save class="mr-2 h-4 w-4" />
              Save
              <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <SaveAll class="mr-2 h-4 w-4" />
              Save All
              <MenubarShortcut>⌘⌥S</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem variant="destructive">
              <LogOut class="mr-2 h-4 w-4" />
              Exit
              <MenubarShortcut>⌘Q</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Undo class="mr-2 h-4 w-4" />
              Undo
              <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Redo class="mr-2 h-4 w-4" />
              Redo
              <MenubarShortcut>⌘⇧Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarLabel>Clipboard</MenubarLabel>
              <MenubarItem>
                <Scissors class="mr-2 h-4 w-4" />
                Scissors
                <MenubarShortcut>⌘X</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <Copy class="mr-2 h-4 w-4" />
                Copy
                <MenubarShortcut>⌘C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <Clipboard class="mr-2 h-4 w-4" />
                Clipboard
                <MenubarShortcut>⌘V</MenubarShortcut>
              </MenubarItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarItem>
              <Search class="mr-2 h-4 w-4" />
              Find
              <MenubarShortcut>⌘F</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Replace class="mr-2 h-4 w-4" />
              Find & Replace
              <MenubarShortcut>⌘⌥F</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Layout class="mr-2 h-4 w-4" />
              Command Palette
              <MenubarShortcut>⌘⇧P</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Eye class="mr-2 h-4 w-4" />
              Toggle Sidebar
              <MenubarShortcut>⌘B</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Layout class="mr-2 h-4 w-4" />
              Toggle Panel
              <MenubarShortcut>⌘J</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <ZoomIn class="mr-2 h-4 w-4" />
              Zoom In
              <MenubarShortcut>⌘+</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <ZoomOut class="mr-2 h-4 w-4" />
              Zoom Out
              <MenubarShortcut>⌘-</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Tools</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Settings class="mr-2 h-4 w-4" />
              Settings
              <MenubarShortcut>⌘,</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Keyboard class="mr-2 h-4 w-4" />
              Keyboard Shortcuts
              <MenubarShortcut>⌘K ⌘S</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Bug class="mr-2 h-4 w-4" />
              Report Issue
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <BookOpen class="mr-2 h-4 w-4" />
              Documentation
            </MenubarItem>
            <MenubarItem>
              <HelpCircle class="mr-2 h-4 w-4" />
              Help Center
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Github class="mr-2 h-4 w-4" />
              GitHub Repository
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Info class="mr-2 h-4 w-4" />
              About
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    `,
  }),
}

export const TextEditorMenu: Story = {
  render: () => ({
    components: {
      Menubar,
      MenubarMenu,
      MenubarTrigger,
      MenubarContent,
      MenubarItem,
      MenubarGroup,
      MenubarLabel,
      MenubarSeparator,
      MenubarShortcut,
      MenubarCheckboxItem,
      MenubarRadioGroup,
      MenubarRadioItem,
      MenubarSub,
      MenubarSubTrigger,
      MenubarSubContent,
      File,
      Save,
      Edit,
      Bold,
      Italic,
      Underline,
      AlignLeft,
      AlignCenter,
      AlignRight,
      AlignJustify,
      Type,
      Palette,
      Eye,
      Settings,
      HelpCircle,
    },
    setup() {
      return { mockEditorData }
    },
    template: `
      <Menubar class="border-b">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <File class="mr-2 h-4 w-4" />
              New Document
              <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <FolderOpen class="mr-2 h-4 w-4" />
              Open...
              <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Save class="mr-2 h-4 w-4" />
              Save
              <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
            <MenubarSub>
              <MenubarSubTrigger>
                <Download class="mr-2 h-4 w-4" />
                Export As
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarItem>PDF Document</MenubarItem>
                <MenubarItem>Word Document</MenubarItem>
                <MenubarItem>Plain Text</MenubarItem>
                <MenubarItem>Markdown</MenubarItem>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Undo class="mr-2 h-4 w-4" />
              Undo
              <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Redo class="mr-2 h-4 w-4" />
              Redo
              <MenubarShortcut>⌘⇧Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Scissors class="mr-2 h-4 w-4" />
              Scissors
              <MenubarShortcut>⌘X</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Copy class="mr-2 h-4 w-4" />
              Copy
              <MenubarShortcut>⌘C</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Clipboard class="mr-2 h-4 w-4" />
              Clipboard
              <MenubarShortcut>⌘V</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Format</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Text Style</MenubarLabel>
              <MenubarCheckboxItem
                :checked="mockEditorData.formatting.bold.value"
                @update:checked="mockEditorData.formatting.bold.value = $event"
              >
                <Bold class="mr-2 h-4 w-4" />
                Bold
                <MenubarShortcut>⌘B</MenubarShortcut>
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :checked="mockEditorData.formatting.italic.value"
                @update:checked="mockEditorData.formatting.italic.value = $event"
              >
                <Italic class="mr-2 h-4 w-4" />
                Italic
                <MenubarShortcut>⌘I</MenubarShortcut>
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :checked="mockEditorData.formatting.underline.value"
                @update:checked="mockEditorData.formatting.underline.value = $event"
              >
                <Underline class="mr-2 h-4 w-4" />
                Underline
                <MenubarShortcut>⌘U</MenubarShortcut>
              </MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarLabel>Text Alignment</MenubarLabel>
              <MenubarRadioGroup v-model="mockEditorData.formatting.alignment.value">
                <MenubarRadioItem value="left">
                  <AlignLeft class="mr-2 h-4 w-4" />
                  Left
                  <MenubarShortcut>⌘⇧L</MenubarShortcut>
                </MenubarRadioItem>
                <MenubarRadioItem value="center">
                  <AlignCenter class="mr-2 h-4 w-4" />
                  Center
                  <MenubarShortcut>⌘⇧E</MenubarShortcut>
                </MenubarRadioItem>
                <MenubarRadioItem value="right">
                  <AlignRight class="mr-2 h-4 w-4" />
                  Right
                  <MenubarShortcut>⌘⇧R</MenubarShortcut>
                </MenubarRadioItem>
                <MenubarRadioItem value="justify">
                  <AlignJustify class="mr-2 h-4 w-4" />
                  Justify
                  <MenubarShortcut>⌘⇧J</MenubarShortcut>
                </MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarSub>
              <MenubarSubTrigger>
                <Type class="mr-2 h-4 w-4" />
                Font Size
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarRadioGroup v-model="mockEditorData.formatting.fontSize.value">
                  <MenubarRadioItem value="10">10px</MenubarRadioItem>
                  <MenubarRadioItem value="12">12px</MenubarRadioItem>
                  <MenubarRadioItem value="14">14px</MenubarRadioItem>
                  <MenubarRadioItem value="16">16px</MenubarRadioItem>
                  <MenubarRadioItem value="18">18px</MenubarRadioItem>
                  <MenubarRadioItem value="24">24px</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarSubContent>
            </MenubarSub>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarCheckboxItem
              :checked="mockEditorData.tools.spellCheck.value"
              @update:checked="mockEditorData.tools.spellCheck.value = $event"
            >
              <Check class="mr-2 h-4 w-4" />
              Spell Check
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              :checked="mockEditorData.tools.grammar.value"
              @update:checked="mockEditorData.tools.grammar.value = $event"
            >
              <Check class="mr-2 h-4 w-4" />
              Grammar Check
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarCheckboxItem
              :checked="mockEditorData.tools.readingMode.value"
              @update:checked="mockEditorData.tools.readingMode.value = $event"
            >
              <BookOpen class="mr-2 h-4 w-4" />
              Reading Mode
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              :checked="mockEditorData.tools.focusMode.value"
              @update:checked="mockEditorData.tools.focusMode.value = $event"
            >
              <Eye class="mr-2 h-4 w-4" />
              Focus Mode
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Tools</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Settings class="mr-2 h-4 w-4" />
              Preferences
              <MenubarShortcut>⌘,</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <HelpCircle class="mr-2 h-4 w-4" />
              Help Center
            </MenubarItem>
            <MenubarItem>
              <Info class="mr-2 h-4 w-4" />
              About Editor
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    `,
  }),
}

export const MediaPlayerMenu: Story = {
  render: () => ({
    components: {
      Menubar,
      MenubarMenu,
      MenubarTrigger,
      MenubarContent,
      MenubarItem,
      MenubarGroup,
      MenubarLabel,
      MenubarSeparator,
      MenubarShortcut,
      MenubarCheckboxItem,
      MenubarRadioGroup,
      MenubarRadioItem,
      File,
      FolderOpen,
      Play,
      Pause,
      Square,
      SkipBack,
      SkipForward,
      Shuffle,
      Repeat,
      Volume2,
      VolumeX,
      Music,
      Video,
      Image,
      Eye,
      Grid,
      List,
      Settings,
      HelpCircle,
    },
    setup() {
      return { mockMediaPlayerData }
    },
    template: `
      <Menubar class="border-b">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <File class="mr-2 h-4 w-4" />
              Open File...
              <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <FolderOpen class="mr-2 h-4 w-4" />
              Open Folder...
              <MenubarShortcut>⌘⇧O</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Upload class="mr-2 h-4 w-4" />
              Import Media...
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Music class="mr-2 h-4 w-4" />
              Create Playlist
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Playback</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Play class="mr-2 h-4 w-4" />
              Play/Pause
              <MenubarShortcut>Space</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Square class="mr-2 h-4 w-4" />
              Stop
              <MenubarShortcut>S</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <SkipBack class="mr-2 h-4 w-4" />
              Previous Track
              <MenubarShortcut>⌘←</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <SkipForward class="mr-2 h-4 w-4" />
              Next Track
              <MenubarShortcut>⌘→</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarLabel>Options</MenubarLabel>
              <MenubarCheckboxItem
                :checked="mockMediaPlayerData.playback.shuffle.value"
                @update:checked="mockMediaPlayerData.playback.shuffle.value = $event"
              >
                <Shuffle class="mr-2 h-4 w-4" />
                Shuffle
                <MenubarShortcut>⌘S</MenubarShortcut>
              </MenubarCheckboxItem>
              <MenubarRadioGroup v-model="mockMediaPlayerData.playback.repeat.value">
                <MenubarRadioItem value="none">
                  <X class="mr-2 h-4 w-4" />
                  No Repeat
                </MenubarRadioItem>
                <MenubarRadioItem value="one">
                  <Repeat class="mr-2 h-4 w-4" />
                  Repeat One
                </MenubarRadioItem>
                <MenubarRadioItem value="all">
                  <Repeat class="mr-2 h-4 w-4" />
                  Repeat All
                </MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarCheckboxItem
              :checked="!mockMediaPlayerData.playback.muted.value"
              @update:checked="mockMediaPlayerData.playback.muted.value = !$event"
            >
              <Volume2 class="mr-2 h-4 w-4" />
              Sound
              <MenubarShortcut>M</MenubarShortcut>
            </MenubarCheckboxItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Library View</MenubarLabel>
              <MenubarCheckboxItem
                :checked="mockMediaPlayerData.library.showArtwork.value"
                @update:checked="mockMediaPlayerData.library.showArtwork.value = $event"
              >
                <Image class="mr-2 h-4 w-4" />
                Show Artwork
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :checked="mockMediaPlayerData.library.groupByAlbum.value"
                @update:checked="mockMediaPlayerData.library.groupByAlbum.value = $event"
              >
                <Grid class="mr-2 h-4 w-4" />
                Group by Album
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :checked="mockMediaPlayerData.library.showGenre.value"
                @update:checked="mockMediaPlayerData.library.showGenre.value = $event"
              >
                <Tag class="mr-2 h-4 w-4" />
                Show Genre
              </MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarItem>
              <Eye class="mr-2 h-4 w-4" />
              Full Screen
              <MenubarShortcut>F</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Maximize class="mr-2 h-4 w-4" />
              Mini Player
              <MenubarShortcut>⌘M</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Tools</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Settings class="mr-2 h-4 w-4" />
              Preferences
              <MenubarShortcut>⌘,</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Database class="mr-2 h-4 w-4" />
              Media Library
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Download class="mr-2 h-4 w-4" />
              Download Manager
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <HelpCircle class="mr-2 h-4 w-4" />
              User Guide
            </MenubarItem>
            <MenubarItem>
              <Keyboard class="mr-2 h-4 w-4" />
              Keyboard Shortcuts
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Info class="mr-2 h-4 w-4" />
              About Player
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    `,
  }),
}

export const SystemSettingsMenu: Story = {
  render: () => ({
    components: {
      Menubar,
      MenubarMenu,
      MenubarTrigger,
      MenubarContent,
      MenubarItem,
      MenubarGroup,
      MenubarLabel,
      MenubarSeparator,
      MenubarShortcut,
      MenubarCheckboxItem,
      MenubarRadioGroup,
      MenubarRadioItem,
      MenubarSub,
      MenubarSubTrigger,
      MenubarSubContent,
      Wifi,
      WifiOff,
      Battery,
      Sun,
      Moon,
      Monitor,
      Volume2,
      ShieldCheck,
      Lock,
      Bell,
      Settings,
      Info,
      Power,
      RefreshCw,
    },
    setup() {
      return { mockSystemData }
    },
    template: `
      <Menubar class="border-b">
        <MenubarMenu>
          <MenubarTrigger>Network</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Connectivity</MenubarLabel>
              <MenubarCheckboxItem
                :checked="mockSystemData.network.wifi.value"
                @update:checked="mockSystemData.network.wifi.value = $event"
              >
                <Wifi class="mr-2 h-4 w-4" />
                Wi-Fi
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :checked="mockSystemData.network.bluetooth.value"
                @update:checked="mockSystemData.network.bluetooth.value = $event"
              >
                <WifiOff class="mr-2 h-4 w-4" />
                Bluetooth
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :checked="mockSystemData.network.hotspot.value"
                @update:checked="mockSystemData.network.hotspot.value = $event"
              >
                <Wifi class="mr-2 h-4 w-4" />
                Mobile Hotspot
              </MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarItem>
              <Settings class="mr-2 h-4 w-4" />
              Network Settings...
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Display</MenubarTrigger>
          <MenubarContent>
            <MenubarSub>
              <MenubarSubTrigger>
                <Sun class="mr-2 h-4 w-4" />
                Theme
              </MenubarSubTrigger>
              <MenubarSubContent>
                <MenubarRadioGroup v-model="mockApplicationData.preferences.theme.value">
                  <MenubarRadioItem value="light">
                    <Sun class="mr-2 h-4 w-4" />
                    Light
                  </MenubarRadioItem>
                  <MenubarRadioItem value="dark">
                    <Moon class="mr-2 h-4 w-4" />
                    Dark
                  </MenubarRadioItem>
                  <MenubarRadioItem value="system">
                    <Monitor class="mr-2 h-4 w-4" />
                    System
                  </MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarSubContent>
            </MenubarSub>
            <MenubarSeparator />
            <MenubarCheckboxItem
              :checked="mockSystemData.display.nightMode.value"
              @update:checked="mockSystemData.display.nightMode.value = $event"
            >
              <Moon class="mr-2 h-4 w-4" />
              Night Light
            </MenubarCheckboxItem>
            <MenubarCheckboxItem
              :checked="mockSystemData.display.autoRotate.value"
              @update:checked="mockSystemData.display.autoRotate.value = $event"
            >
              <RotateCcw class="mr-2 h-4 w-4" />
              Auto-rotate Screen
            </MenubarCheckboxItem>
            <MenubarSeparator />
            <MenubarItem>
              <Settings class="mr-2 h-4 w-4" />
              Display Settings...
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Audio</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Volume2 class="mr-2 h-4 w-4" />
              Volume Mixer...
            </MenubarItem>
            <MenubarItem>
              <Headphones class="mr-2 h-4 w-4" />
              Audio Devices...
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Settings class="mr-2 h-4 w-4" />
              Sound Settings...
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Privacy</MenubarTrigger>
          <MenubarContent>
            <MenubarGroup>
              <MenubarLabel>Privacy Settings</MenubarLabel>
              <MenubarCheckboxItem
                :checked="mockSystemData.privacy.locationServices.value"
                @update:checked="mockSystemData.privacy.locationServices.value = $event"
              >
                <ShieldCheck class="mr-2 h-4 w-4" />
                Location Services
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :checked="mockSystemData.privacy.analytics.value"
                @update:checked="mockSystemData.privacy.analytics.value = $event"
              >
                <ShieldCheck class="mr-2 h-4 w-4" />
                Share Analytics
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :checked="mockSystemData.privacy.crashReports.value"
                @update:checked="mockSystemData.privacy.crashReports.value = $event"
              >
                <Bug class="mr-2 h-4 w-4" />
                Send Crash Reports
              </MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarItem>
              <Lock class="mr-2 h-4 w-4" />
              Security Settings...
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>System</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <RefreshCw class="mr-2 h-4 w-4" />
              Check for Updates...
            </MenubarItem>
            <MenubarItem>
              <Battery class="mr-2 h-4 w-4" />
              Power Options...
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Info class="mr-2 h-4 w-4" />
              System Information
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem variant="destructive">
              <Power class="mr-2 h-4 w-4" />
              Restart System
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    `,
  }),
}

export const MinimalMenu: Story = {
  render: () => ({
    components: {
      Menubar,
      MenubarMenu,
      MenubarTrigger,
      MenubarContent,
      MenubarItem,
      MenubarSeparator,
      File,
      Settings,
      HelpCircle,
    },
    template: `
      <Menubar class="w-fit">
        <MenubarMenu>
          <MenubarTrigger class="px-3">Menu</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <File class="mr-2 h-4 w-4" />
              New
            </MenubarItem>
            <MenubarItem>
              <FolderOpen class="mr-2 h-4 w-4" />
              Open
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Settings class="mr-2 h-4 w-4" />
              Settings
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <HelpCircle class="mr-2 h-4 w-4" />
              Help
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    `,
  }),
}

export const WithPreferences: Story = {
  render: () => ({
    components: {
      Menubar,
      MenubarMenu,
      MenubarTrigger,
      MenubarContent,
      MenubarItem,
      MenubarGroup,
      MenubarLabel,
      MenubarSeparator,
      MenubarCheckboxItem,
      MenubarRadioGroup,
      MenubarRadioItem,
      Settings,
      Eye,
      Type,
      Save,
      Bell,
    },
    setup() {
      return { mockApplicationData }
    },
    template: `
      <Menubar>
        <MenubarMenu>
          <MenubarTrigger>Preferences</MenubarTrigger>
          <MenubarContent class="w-64">
            <MenubarGroup>
              <MenubarLabel>Appearance</MenubarLabel>
              <MenubarRadioGroup v-model="mockApplicationData.preferences.theme.value">
                <MenubarRadioItem value="light">
                  <Sun class="mr-2 h-4 w-4" />
                  Light Theme
                </MenubarRadioItem>
                <MenubarRadioItem value="dark">
                  <Moon class="mr-2 h-4 w-4" />
                  Dark Theme
                </MenubarRadioItem>
                <MenubarRadioItem value="system">
                  <Monitor class="mr-2 h-4 w-4" />
                  System Theme
                </MenubarRadioItem>
              </MenubarRadioGroup>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarLabel>Editor</MenubarLabel>
              <MenubarCheckboxItem
                :checked="mockApplicationData.preferences.autoSave.value"
                @update:checked="mockApplicationData.preferences.autoSave.value = $event"
              >
                <Save class="mr-2 h-4 w-4" />
                Auto Save
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :checked="mockApplicationData.preferences.lineNumbers.value"
                @update:checked="mockApplicationData.preferences.lineNumbers.value = $event"
              >
                <Type class="mr-2 h-4 w-4" />
                Line Numbers
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :checked="mockApplicationData.preferences.wordWrap.value"
                @update:checked="mockApplicationData.preferences.wordWrap.value = $event"
              >
                <Type class="mr-2 h-4 w-4" />
                Word Wrap
              </MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarLabel>View Options</MenubarLabel>
              <MenubarCheckboxItem
                :checked="mockApplicationData.view.sidebar.value"
                @update:checked="mockApplicationData.view.sidebar.value = $event"
              >
                <Eye class="mr-2 h-4 w-4" />
                Show Sidebar
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :checked="mockApplicationData.view.statusBar.value"
                @update:checked="mockApplicationData.view.statusBar.value = $event"
              >
                <Eye class="mr-2 h-4 w-4" />
                Show Status Bar
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :checked="mockApplicationData.view.minimap.value"
                @update:checked="mockApplicationData.view.minimap.value = $event"
              >
                <Eye class="mr-2 h-4 w-4" />
                Show Minimap
              </MenubarCheckboxItem>
            </MenubarGroup>
            <MenubarSeparator />
            <MenubarGroup>
              <MenubarLabel>Notifications</MenubarLabel>
              <MenubarCheckboxItem
                :checked="mockApplicationData.notifications.desktop.value"
                @update:checked="mockApplicationData.notifications.desktop.value = $event"
              >
                <Bell class="mr-2 h-4 w-4" />
                Desktop Notifications
              </MenubarCheckboxItem>
              <MenubarCheckboxItem
                :checked="mockApplicationData.notifications.sound.value"
                @update:checked="mockApplicationData.notifications.sound.value = $event"
              >
                <Volume2 class="mr-2 h-4 w-4" />
                Sound Alerts
              </MenubarCheckboxItem>
            </MenubarGroup>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    `,
  }),
}

export const BrowserMenu: Story = {
  render: () => ({
    components: {
      Menubar,
      MenubarMenu,
      MenubarTrigger,
      MenubarContent,
      MenubarItem,
      MenubarGroup,
      MenubarLabel,
      MenubarSeparator,
      MenubarShortcut,
      MenubarCheckboxItem,
      MenubarSub,
      MenubarSubTrigger,
      MenubarSubContent,
      File,
      FolderOpen,
      Save,
      Bookmark,
      Star,
      Home,
      RefreshCw,
      Search,
      Download,
      Share,
      Settings,
      Shield,
      Eye,
      EyeOff,
      History,
      HelpCircle,
    },
    template: `
      <Menubar class="border-b">
        <MenubarMenu>
          <MenubarTrigger>File</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <File class="mr-2 h-4 w-4" />
              New Tab
              <MenubarShortcut>⌘T</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Copy class="mr-2 h-4 w-4" />
              New Window
              <MenubarShortcut>⌘N</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <EyeOff class="mr-2 h-4 w-4" />
              New Private Window
              <MenubarShortcut>⌘⇧N</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <FolderOpen class="mr-2 h-4 w-4" />
              Open File...
              <MenubarShortcut>⌘O</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Save class="mr-2 h-4 w-4" />
              Save Page As...
              <MenubarShortcut>⌘S</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Share class="mr-2 h-4 w-4" />
              Share...
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Edit</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Undo class="mr-2 h-4 w-4" />
              Undo
              <MenubarShortcut>⌘Z</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Redo class="mr-2 h-4 w-4" />
              Redo
              <MenubarShortcut>⌘⇧Z</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Scissors class="mr-2 h-4 w-4" />
              Scissors
              <MenubarShortcut>⌘X</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Copy class="mr-2 h-4 w-4" />
              Copy
              <MenubarShortcut>⌘C</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Clipboard class="mr-2 h-4 w-4" />
              Clipboard
              <MenubarShortcut>⌘V</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Search class="mr-2 h-4 w-4" />
              Find in Page...
              <MenubarShortcut>⌘F</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>View</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <RefreshCw class="mr-2 h-4 w-4" />
              Reload
              <MenubarShortcut>⌘R</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <RefreshCw class="mr-2 h-4 w-4" />
              Hard Reload
              <MenubarShortcut>⌘⇧R</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <ZoomIn class="mr-2 h-4 w-4" />
              Zoom In
              <MenubarShortcut>⌘+</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <ZoomOut class="mr-2 h-4 w-4" />
              Zoom Out
              <MenubarShortcut>⌘-</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Eye class="mr-2 h-4 w-4" />
              Actual Size
              <MenubarShortcut>⌘0</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Maximize class="mr-2 h-4 w-4" />
              Enter Full Screen
              <MenubarShortcut>F11</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Bookmarks</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Star class="mr-2 h-4 w-4" />
              Bookmark This Page
              <MenubarShortcut>⌘D</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Star class="mr-2 h-4 w-4" />
              Bookmark All Tabs...
              <MenubarShortcut>⌘⇧D</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Bookmark class="mr-2 h-4 w-4" />
              Bookmark Manager
              <MenubarShortcut>⌘⌥B</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Home class="mr-2 h-4 w-4" />
              Home Page
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>History</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <History class="mr-2 h-4 w-4" />
              Show Full History
              <MenubarShortcut>⌘Y</MenubarShortcut>
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Trash2 class="mr-2 h-4 w-4" />
              Clear Browsing Data...
              <MenubarShortcut>⌘⇧⌫</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Tools</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <Download class="mr-2 h-4 w-4" />
              Downloads
              <MenubarShortcut>⌘⇧J</MenubarShortcut>
            </MenubarItem>
            <MenubarItem>
              <Settings class="mr-2 h-4 w-4" />
              Extensions
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Settings class="mr-2 h-4 w-4" />
              Settings
              <MenubarShortcut>⌘,</MenubarShortcut>
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>

        <MenubarMenu>
          <MenubarTrigger>Help</MenubarTrigger>
          <MenubarContent>
            <MenubarItem>
              <HelpCircle class="mr-2 h-4 w-4" />
              Help Center
            </MenubarItem>
            <MenubarItem>
              <Keyboard class="mr-2 h-4 w-4" />
              Keyboard Shortcuts
            </MenubarItem>
            <MenubarSeparator />
            <MenubarItem>
              <Info class="mr-2 h-4 w-4" />
              About Browser
            </MenubarItem>
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    `,
  }),
}

export const ContextualActions: Story = {
  render: () => ({
    components: {
      Menubar,
      MenubarMenu,
      MenubarTrigger,
      MenubarContent,
      MenubarItem,
      MenubarSeparator,
      MenubarShortcut,
      Edit,
      Copy,
      Scissors,
      Clipboard,
      Trash2,
      Star,
      Share,
      Download,
      Eye,
      Lock,
      Archive,
    },
    template: `
      <div class="space-y-4">
        <div class="text-sm text-muted-foreground">Document: "Project Proposal.docx" selected</div>
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Actions</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>
                <Eye class="mr-2 h-4 w-4" />
                Open
                <MenubarShortcut>Enter</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <Edit class="mr-2 h-4 w-4" />
                Edit
                <MenubarShortcut>⌘E</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Copy class="mr-2 h-4 w-4" />
                Copy
                <MenubarShortcut>⌘C</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <Scissors class="mr-2 h-4 w-4" />
                Scissors
                <MenubarShortcut>⌘X</MenubarShortcut>
              </MenubarItem>
              <MenubarItem>
                <Copy class="mr-2 h-4 w-4" />
                Duplicate
                <MenubarShortcut>⌘D</MenubarShortcut>
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Star class="mr-2 h-4 w-4" />
                Add to Favorites
              </MenubarItem>
              <MenubarItem>
                <Share class="mr-2 h-4 w-4" />
                Share...
              </MenubarItem>
              <MenubarItem>
                <Download class="mr-2 h-4 w-4" />
                Download
              </MenubarItem>
              <MenubarSeparator />
              <MenubarItem>
                <Archive class="mr-2 h-4 w-4" />
                Archive
              </MenubarItem>
              <MenubarItem variant="destructive">
                <Trash2 class="mr-2 h-4 w-4" />
                Delete
                <MenubarShortcut>⌫</MenubarShortcut>
              </MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </div>
    `,
  }),
}
