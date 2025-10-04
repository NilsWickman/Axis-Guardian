import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  Copy,
  Clipboard,
  Scissors,
  Trash2,
  Edit,
  Eye,
  EyeOff,
  Download,
  Share,
  Settings,
  Info,
  Star,
  StarOff,
  Bookmark,
  BookmarkX,
  RefreshCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  MoreHorizontal,
  File,
  Folder,
  FolderPlus,
  FileText,
  Image,
  Music,
  Video,
} from 'lucide-vue-next'

// Mock data for different context menu scenarios
const mockContextMenus = {
  file: {
    title: 'File Operations',
    actions: [
      { label: 'Open', shortcut: 'Enter', icon: Eye },
      { label: 'Open with...', icon: MoreHorizontal },
      { label: 'Edit', shortcut: 'F2', icon: Edit },
      { label: 'Copy', shortcut: 'Ctrl+C', icon: Copy },
      { label: 'Cut', shortcut: 'Ctrl+X', icon: Scissors },
      { label: 'Delete', shortcut: 'Del', icon: Trash2, variant: 'destructive' },
    ],
    properties: { label: 'Properties', shortcut: 'Alt+Enter', icon: Info },
  },
  text: {
    title: 'Text Editing',
    actions: [
      { label: 'Cut', shortcut: 'Ctrl+X', icon: Scissors },
      { label: 'Copy', shortcut: 'Ctrl+C', icon: Copy },
      { label: 'Paste', shortcut: 'Ctrl+V', icon: Clipboard },
      { label: 'Select All', shortcut: 'Ctrl+A' },
    ],
    formatting: [
      { label: 'Bold', shortcut: 'Ctrl+B' },
      { label: 'Italic', shortcut: 'Ctrl+I' },
      { label: 'Underline', shortcut: 'Ctrl+U' },
    ],
  },
  image: {
    title: 'Image Controls',
    actions: [
      { label: 'View Full Size', icon: ZoomIn },
      { label: 'Zoom Out', icon: ZoomOut },
      { label: 'Rotate Left', icon: RotateCcw },
      { label: 'Download', shortcut: 'Ctrl+S', icon: Download },
      { label: 'Share', icon: Share },
    ],
    view: [
      { label: 'Actual Size', shortcut: 'Ctrl+0' },
      { label: 'Fit to Window', shortcut: 'Ctrl+9' },
      { label: 'Full Screen', shortcut: 'F11', icon: Maximize },
    ],
  },
  folder: {
    title: 'Folder Actions',
    actions: [
      { label: 'Open', icon: Folder },
      { label: 'New Folder', shortcut: 'Ctrl+Shift+N', icon: FolderPlus },
      { label: 'Refresh', shortcut: 'F5', icon: RefreshCw },
    ],
    create: [
      { label: 'Text Document', icon: FileText },
      { label: 'Image', icon: Image },
      { label: 'Audio', icon: Music },
      { label: 'Video', icon: Video },
    ],
  },
}

const meta = {
  title: 'UI Components/ContextMenu',
  component: ContextMenu,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Displays a menu to the user — such as a set of actions or functions — triggered by a right-click or context action.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    modal: {
      control: { type: 'boolean' },
      description: 'Whether the context menu is modal',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
  },
} satisfies Meta<typeof ContextMenu>

export default meta
type Story = StoryObj<typeof meta>

// Basic context menu story
export const Default: Story = {
  render: (args) => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuShortcut,
      Copy,
      Scissors,
      Clipboard,
      Trash2,
    },
    setup() {
      return { args }
    },
    template: `
      <ContextMenu v-bind="args">
        <ContextMenuTrigger class="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
          Right click here
        </ContextMenuTrigger>
        <ContextMenuContent class="w-64">
          <ContextMenuItem>
            <Copy class="mr-2" />
            Copy
            <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Scissors class="mr-2" />
            Cut
            <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Clipboard class="mr-2" />
            Paste
            <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem variant="destructive">
            <Trash2 class="mr-2" />
            Delete
            <ContextMenuShortcut>Del</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
}

// File operations context menu
export const FileOperations: Story = {
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuSeparator,
      ContextMenuShortcut,
      Eye,
      MoreHorizontal,
      Edit,
      Copy,
      Scissors,
      Trash2,
      Info,
      File,
    },
    setup() {
      const fileData = mockContextMenus.file
      return { fileData }
    },
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="flex h-[150px] w-[300px] items-center justify-center rounded-md border bg-muted/50">
          <div class="flex flex-col items-center gap-2 text-sm">
            <File class="h-8 w-8" />
            <span>document.pdf</span>
            <span class="text-xs text-muted-foreground">Right click for options</span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent class="w-64">
          <ContextMenuItem>
            <Eye class="mr-2" />
            {{ fileData.actions[0].label }}
            <ContextMenuShortcut>{{ fileData.actions[0].shortcut }}</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <MoreHorizontal class="mr-2" />
            {{ fileData.actions[1].label }}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>
            <Edit class="mr-2" />
            {{ fileData.actions[2].label }}
            <ContextMenuShortcut>{{ fileData.actions[2].shortcut }}</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Copy class="mr-2" />
            {{ fileData.actions[3].label }}
            <ContextMenuShortcut>{{ fileData.actions[3].shortcut }}</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Scissors class="mr-2" />
            {{ fileData.actions[4].label }}
            <ContextMenuShortcut>{{ fileData.actions[4].shortcut }}</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem variant="destructive">
            <Trash2 class="mr-2" />
            {{ fileData.actions[5].label }}
            <ContextMenuShortcut>{{ fileData.actions[5].shortcut }}</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem>
            <Info class="mr-2" />
            {{ fileData.properties.label }}
            <ContextMenuShortcut>{{ fileData.properties.shortcut }}</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
}

// Text editing context menu
export const TextEditing: Story = {
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuSeparator,
      ContextMenuShortcut,
      ContextMenuGroup,
      ContextMenuLabel,
      Scissors,
      Copy,
      Clipboard,
    },
    setup() {
      const textData = mockContextMenus.text
      return { textData }
    },
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="h-[150px] w-[300px] rounded-md border p-4 text-left">
          <div class="text-sm">
            <p class="font-medium mb-2">Selected Text</p>
            <p class="text-muted-foreground">
              This is some sample text that can be edited. Right-click to see text editing options.
            </p>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent class="w-64">
          <ContextMenuGroup>
            <ContextMenuLabel>{{ textData.title }}</ContextMenuLabel>
            <ContextMenuItem>
              <Scissors class="mr-2" />
              {{ textData.actions[0].label }}
              <ContextMenuShortcut>{{ textData.actions[0].shortcut }}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <Copy class="mr-2" />
              {{ textData.actions[1].label }}
              <ContextMenuShortcut>{{ textData.actions[1].shortcut }}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <Clipboard class="mr-2" />
              {{ textData.actions[2].label }}
              <ContextMenuShortcut>{{ textData.actions[2].shortcut }}</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              {{ textData.actions[3].label }}
              <ContextMenuShortcut>{{ textData.actions[3].shortcut }}</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>Formatting</ContextMenuLabel>
            <ContextMenuItem v-for="format in textData.formatting" :key="format.label">
              {{ format.label }}
              <ContextMenuShortcut>{{ format.shortcut }}</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
}

// Context menu with checkbox items
export const WithCheckboxItems: Story = {
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuCheckboxItem,
      ContextMenuSeparator,
      ContextMenuLabel,
      Eye,
      EyeOff,
      Settings,
    },
    setup() {
      const showBookmarks = ref(true)
      const showSidebar = ref(false)
      const showStatusBar = ref(true)
      const showToolbar = ref(true)

      return { showBookmarks, showSidebar, showStatusBar, showToolbar }
    },
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="flex h-[150px] w-[300px] items-center justify-center rounded-md border">
          <div class="text-center text-sm">
            <Settings class="mx-auto mb-2 h-8 w-8" />
            <p>View Options</p>
            <p class="text-xs text-muted-foreground">Right click to toggle view settings</p>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent class="w-56">
          <ContextMenuLabel>View Options</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem v-model:checked="showBookmarks">
            Show Bookmarks
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem v-model:checked="showSidebar">
            Show Sidebar
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem v-model:checked="showStatusBar">
            Show Status Bar
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem v-model:checked="showToolbar">
            Show Toolbar
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuItem>
            <Eye class="mr-2" />
            Show Hidden Files
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
}

// Context menu with radio items
export const WithRadioItems: Story = {
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuRadioGroup,
      ContextMenuRadioItem,
      ContextMenuSeparator,
      ContextMenuLabel,
      ZoomIn,
    },
    setup() {
      const zoomLevel = ref('100')
      return { zoomLevel }
    },
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="flex h-[150px] w-[300px] items-center justify-center rounded-md border">
          <div class="text-center text-sm">
            <ZoomIn class="mx-auto mb-2 h-8 w-8" />
            <p>Zoom: {{ zoomLevel }}%</p>
            <p class="text-xs text-muted-foreground">Right click to change zoom level</p>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent class="w-56">
          <ContextMenuLabel>Zoom Level</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuRadioGroup v-model="zoomLevel">
            <ContextMenuRadioItem value="50">50%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="75">75%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="100">100%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="125">125%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="150">150%</ContextMenuRadioItem>
            <ContextMenuRadioItem value="200">200%</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
          <ContextMenuSeparator />
          <ContextMenuItem>Fit to Window</ContextMenuItem>
          <ContextMenuItem>Actual Size</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
}

// Context menu with sub-menus
export const WithSubMenus: Story = {
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuSub,
      ContextMenuSubTrigger,
      ContextMenuSubContent,
      ContextMenuSeparator,
      ContextMenuShortcut,
      Folder,
      FolderPlus,
      FileText,
      Image,
      Music,
      Video,
      RefreshCw,
      Settings,
      Share,
    },
    setup() {
      const folderData = mockContextMenus.folder
      return { folderData }
    },
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="flex h-[150px] w-[300px] items-center justify-center rounded-md border bg-muted/20">
          <div class="text-center text-sm">
            <Folder class="mx-auto mb-2 h-8 w-8" />
            <p>Projects Folder</p>
            <p class="text-xs text-muted-foreground">Right click for folder options</p>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent class="w-64">
          <ContextMenuItem>
            <Folder class="mr-2" />
            {{ folderData.actions[0].label }}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <FolderPlus class="mr-2" />
              New
            </ContextMenuSubTrigger>
            <ContextMenuSubContent class="w-48">
              <ContextMenuItem>
                <Folder class="mr-2" />
                Folder
                <ContextMenuShortcut>Ctrl+Shift+N</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem v-for="item in folderData.create" :key="item.label">
                <component :is="item.icon" class="mr-2" />
                {{ item.label }}
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Share class="mr-2" />
              Share
            </ContextMenuSubTrigger>
            <ContextMenuSubContent class="w-48">
              <ContextMenuItem>Copy Link</ContextMenuItem>
              <ContextMenuItem>Email Link</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>Export as ZIP</ContextMenuItem>
              <ContextMenuItem>Create Archive</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem>
            <RefreshCw class="mr-2" />
            {{ folderData.actions[2].label }}
            <ContextMenuShortcut>{{ folderData.actions[2].shortcut }}</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Settings class="mr-2" />
            Folder Settings
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
}

// Image context menu with advanced options
export const ImageControls: Story = {
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuSeparator,
      ContextMenuShortcut,
      ContextMenuGroup,
      ContextMenuLabel,
      ContextMenuCheckboxItem,
      ZoomIn,
      ZoomOut,
      RotateCcw,
      Download,
      Share,
      Maximize,
      Star,
      StarOff,
      Bookmark,
      BookmarkX,
    },
    setup() {
      const imageData = mockContextMenus.image
      const isFavorite = ref(false)
      const isBookmarked = ref(true)
      const showMetadata = ref(false)

      return { imageData, isFavorite, isBookmarked, showMetadata }
    },
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="flex h-[200px] w-[300px] items-center justify-center rounded-md border bg-gradient-to-br from-blue-50 to-purple-50">
          <div class="text-center text-sm">
            <div class="mb-4 h-16 w-16 mx-auto bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex items-center justify-center">
              <Image class="h-8 w-8 text-white" />
            </div>
            <p class="font-medium">vacation-photo.jpg</p>
            <p class="text-xs text-muted-foreground">Right click for image options</p>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent class="w-64">
          <ContextMenuGroup>
            <ContextMenuLabel>{{ imageData.title }}</ContextMenuLabel>
            <ContextMenuItem>
              <ZoomIn class="mr-2" />
              {{ imageData.actions[0].label }}
            </ContextMenuItem>
            <ContextMenuItem>
              <ZoomOut class="mr-2" />
              {{ imageData.actions[1].label }}
            </ContextMenuItem>
            <ContextMenuItem>
              <RotateCcw class="mr-2" />
              {{ imageData.actions[2].label }}
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuGroup>
            <ContextMenuLabel>View Options</ContextMenuLabel>
            <ContextMenuItem v-for="view in imageData.view" :key="view.label">
              <Maximize v-if="view.icon" class="mr-2" />
              {{ view.label }}
              <ContextMenuShortcut v-if="view.shortcut">{{ view.shortcut }}</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem v-model:checked="isFavorite">
            <Star v-if="isFavorite" class="mr-2" />
            <StarOff v-else class="mr-2" />
            Add to Favorites
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem v-model:checked="isBookmarked">
            <Bookmark v-if="isBookmarked" class="mr-2" />
            <BookmarkX v-else class="mr-2" />
            Bookmark
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem v-model:checked="showMetadata">
            Show Metadata
          </ContextMenuCheckboxItem>
          <ContextMenuSeparator />
          <ContextMenuItem>
            <Download class="mr-2" />
            {{ imageData.actions[3].label }}
            <ContextMenuShortcut>{{ imageData.actions[3].shortcut }}</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            <Share class="mr-2" />
            {{ imageData.actions[4].label }}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
}

// Comprehensive example with all features
export const ComprehensiveExample: Story = {
  render: () => ({
    components: {
      ContextMenu,
      ContextMenuTrigger,
      ContextMenuContent,
      ContextMenuItem,
      ContextMenuCheckboxItem,
      ContextMenuRadioGroup,
      ContextMenuRadioItem,
      ContextMenuSeparator,
      ContextMenuShortcut,
      ContextMenuGroup,
      ContextMenuLabel,
      ContextMenuSub,
      ContextMenuSubTrigger,
      ContextMenuSubContent,
      Copy,
      Scissors,
      Clipboard,
      Trash2,
      Edit,
      Star,
      Settings,
      Share,
      Download,
      Eye,
      EyeOff,
    },
    setup() {
      const isVisible = ref(true)
      const isFavorite = ref(false)
      const viewMode = ref('grid')
      const sortBy = ref('name')

      return { isVisible, isFavorite, viewMode, sortBy }
    },
    template: `
      <ContextMenu>
        <ContextMenuTrigger class="flex h-[200px] w-[400px] items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/25 bg-muted/10">
          <div class="text-center">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Settings class="h-6 w-6" />
            </div>
            <h3 class="text-lg font-medium">Comprehensive Context Menu</h3>
            <p class="text-sm text-muted-foreground mt-2">
              Right-click to see all context menu features:<br />
              Items, checkboxes, radio groups, sub-menus, shortcuts, and more
            </p>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent class="w-72">
          <!-- Basic Actions -->
          <ContextMenuGroup>
            <ContextMenuItem>
              <Edit class="mr-2" />
              Edit
              <ContextMenuShortcut>Ctrl+E</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <Copy class="mr-2" />
              Copy
              <ContextMenuShortcut>Ctrl+C</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <Scissors class="mr-2" />
              Cut
              <ContextMenuShortcut>Ctrl+X</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem>
              <Clipboard class="mr-2" />
              Paste
              <ContextMenuShortcut>Ctrl+V</ContextMenuShortcut>
            </ContextMenuItem>
          </ContextMenuGroup>
          
          <ContextMenuSeparator />
          
          <!-- Checkboxes -->
          <ContextMenuGroup>
            <ContextMenuLabel>Options</ContextMenuLabel>
            <ContextMenuCheckboxItem v-model:checked="isVisible">
              <Eye v-if="isVisible" class="mr-2" />
              <EyeOff v-else class="mr-2" />
              Visible
            </ContextMenuCheckboxItem>
            <ContextMenuCheckboxItem v-model:checked="isFavorite">
              <Star class="mr-2" />
              Add to Favorites
            </ContextMenuCheckboxItem>
          </ContextMenuGroup>
          
          <ContextMenuSeparator />
          
          <!-- Radio Groups -->
          <ContextMenuGroup>
            <ContextMenuLabel>View Mode</ContextMenuLabel>
            <ContextMenuRadioGroup v-model="viewMode">
              <ContextMenuRadioItem value="list">List View</ContextMenuRadioItem>
              <ContextMenuRadioItem value="grid">Grid View</ContextMenuRadioItem>
              <ContextMenuRadioItem value="tiles">Tiles View</ContextMenuRadioItem>
            </ContextMenuRadioGroup>
          </ContextMenuGroup>
          
          <ContextMenuSeparator />
          
          <!-- Sub-menus -->
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Share class="mr-2" />
              Share
            </ContextMenuSubTrigger>
            <ContextMenuSubContent class="w-48">
              <ContextMenuItem>Email</ContextMenuItem>
              <ContextMenuItem>Copy Link</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>Social Media</ContextMenuItem>
              <ContextMenuItem>Export</ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
          
          <ContextMenuSub>
            <ContextMenuSubTrigger>Sort By</ContextMenuSubTrigger>
            <ContextMenuSubContent class="w-48">
              <ContextMenuRadioGroup v-model="sortBy">
                <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
                <ContextMenuRadioItem value="date">Date Modified</ContextMenuRadioItem>
                <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
                <ContextMenuRadioItem value="type">Type</ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuSubContent>
          </ContextMenuSub>
          
          <ContextMenuSeparator />
          
          <!-- Final Actions -->
          <ContextMenuItem>
            <Download class="mr-2" />
            Download
            <ContextMenuShortcut>Ctrl+D</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem variant="destructive">
            <Trash2 class="mr-2" />
            Delete
            <ContextMenuShortcut>Del</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    `,
  }),
}
