import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, computed } from 'vue'
import { fn } from 'storybook/test'

// Inline Button component for the header
const MyButton = defineComponent({
  name: 'MyButton',
  props: {
    label: { type: String, required: true },
    primary: { type: Boolean, default: false },
    size: { type: String as () => 'small' | 'medium' | 'large', default: 'medium' },
    backgroundColor: { type: String, default: undefined },
  },
  emits: ['click'],
  setup(props, { emit }) {
    const classes = computed(() => ({
      'storybook-button': true,
      'storybook-button--primary': props.primary,
      'storybook-button--secondary': !props.primary,
      [`storybook-button--${props.size}`]: true,
    }))

    const style = computed(() => ({
      backgroundColor: props.backgroundColor,
    }))

    const onClick = () => {
      emit('click', 1)
    }

    return { classes, style, onClick }
  },
  template: `
    <button type="button" :class="classes" :style="style" @click="onClick">{{ label }}</button>
    <style>
      .storybook-button {
        display: inline-block;
        cursor: pointer;
        border: 0;
        border-radius: 3em;
        font-weight: 700;
        line-height: 1;
        font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
      }
      .storybook-button--primary {
        background-color: #555ab9;
        color: white;
      }
      .storybook-button--secondary {
        box-shadow: rgba(0, 0, 0, 0.15) 0px 0px 0px 1px inset;
        background-color: transparent;
        color: #333;
      }
      .storybook-button--small {
        padding: 10px 16px;
        font-size: 12px;
      }
      .storybook-button--medium {
        padding: 11px 20px;
        font-size: 14px;
      }
      .storybook-button--large {
        padding: 12px 24px;
        font-size: 16px;
      }
    </style>
  `,
})

// Inline Header component
const MyHeader = defineComponent({
  name: 'MyHeader',
  components: { MyButton },
  props: {
    user: { type: Object as () => { name: string } | null, default: null },
  },
  emits: ['createAccount', 'login', 'logout'],
  template: `
    <header>
      <div class="storybook-header">
        <div>
          <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fill-rule="evenodd">
              <path
                d="M10 0h12a10 10 0 0110 10v12a10 10 0 01-10 10H10A10 10 0 010 22V10A10 10 0 0110 0z"
                fill="#FFF"
              />
              <path
                d="M5.3 10.6l10.4 6v11.1l-10.4-6v-11zm11.4-6.2l9.7 5.5-9.7 5.6V4.4z"
                fill="#555AB9"
              />
              <path
                d="M27.2 10.6v11.2l-10.5 6V16.5l10.5-6zM15.7 4.4v11L6 10l9.7-5.5z"
                fill="#91BAF8"
              />
            </g>
          </svg>
          <h1>Acme</h1>
        </div>
        <div>
          <span v-if="user" class="welcome"
            >Welcome, <b>{{ user.name }}</b
            >!</span
          >
          <my-button v-if="user" size="small" label="Log out" @click="$emit('logout')" />
          <my-button v-if="!user" size="small" label="Log in" @click="$emit('login')" />
          <my-button
            v-if="!user"
            primary
            size="small"
            label="Sign up"
            @click="$emit('createAccount')"
          />
        </div>
      </div>
      <style>
        .storybook-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          padding: 15px 20px;
          font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }

        .storybook-header svg {
          display: inline-block;
          vertical-align: top;
        }

        .storybook-header h1 {
          display: inline-block;
          vertical-align: top;
          margin: 6px 0 6px 10px;
          font-weight: 700;
          font-size: 20px;
          line-height: 1;
        }

        .storybook-header button + button {
          margin-left: 10px;
        }

        .storybook-header .welcome {
          margin-right: 10px;
          color: #333;
          font-size: 14px;
        }
      </style>
    </header>
  `,
})

const meta = {
  /* 👇 The title prop is optional.
   * See https://storybook.js.org/docs/configure/#configure-story-loading
   * to learn how to generate automatic titles
   */
  title: 'Example/Header',
  component: MyHeader,
  render: (args: any) => ({
    components: { MyHeader },
    setup() {
      return { args }
    },
    template: '<my-header :user="args.user" />',
  }),
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {
    onLogin: fn(),
    onLogout: fn(),
    onCreateAccount: fn(),
  },
  // This component will have an automatically generated docsPage entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
} satisfies Meta<typeof MyHeader>

export default meta
type Story = StoryObj<typeof meta>

export const LoggedIn: Story = {
  args: {
    user: {
      name: 'Jane Doe',
    },
  },
}

export const LoggedOut: Story = {
  args: {
    user: null,
  },
}
