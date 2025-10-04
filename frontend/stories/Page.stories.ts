import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, ref, computed } from 'vue'
import { expect, userEvent, within } from 'storybook/test'

// Inline Button component for the page
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

// Inline Header component for the page
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

// Inline Page component
const MyPage = defineComponent({
  name: 'MyPage',
  components: { MyHeader },
  setup() {
    const user = ref<{ name: string } | null>(null)

    const onLogin = () => {
      user.value = { name: 'Jane Doe' }
    }
    const onLogout = () => {
      user.value = null
    }
    const onCreateAccount = () => {
      user.value = { name: 'Jane Doe' }
    }

    return { user, onLogin, onLogout, onCreateAccount }
  },
  template: `
    <article>
      <my-header :user="user" @login="onLogin" @logout="onLogout" @create-account="onCreateAccount" />

      <section class="storybook-page">
        <h2>Pages in Storybook</h2>
        <p>
          We recommend building UIs with a
          <a href="https://componentdriven.org" target="_blank" rel="noopener noreferrer">
            <strong>component-driven</strong>
          </a>
          process starting with atomic components and ending with pages.
        </p>
        <p>
          Render pages with mock data. This makes it easy to build and review page states without
          needing to navigate to them in your app. Here are some handy patterns for managing page data
          in Storybook:
        </p>
        <ul>
          <li>
            Use a higher-level connected component. Storybook helps you compose such data from the
            "args" of child component stories
          </li>
          <li>
            Assemble data in the page component from your services. You can mock these services out
            using Storybook.
          </li>
        </ul>
        <p>
          Get a guided tutorial on component-driven development at
          <a href="https://storybook.js.org/tutorials/" target="_blank" rel="noopener noreferrer"
            >Storybook tutorials</a
          >
          . Read more in the
          <a href="https://storybook.js.org/docs" target="_blank" rel="noopener noreferrer">docs</a>
          .
        </p>
        <div class="tip-wrapper">
          <span class="tip">Tip</span>
          Adjust the width of the canvas with the
          <svg width="10" height="10" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
            <g fill="none" fill-rule="evenodd">
              <path
                id="a"
                d="M1.5 5.2h4.8c.3 0 .5.2.5.4v5.1c-.1.2-.3.3-.4.3H1.4a.5.5 0 01-.5-.4V5.7c0-.3.2-.5.5-.5zm0-2.1h6.9c.3 0 .5.2.5.4v7a.5.5 0 01-1 0V4H1.5a.5.5 0 010-1zm0-2.1h9c.3 0 .5.2.5.4v9.1a.5.5 0 01-1 0V2H1.5a.5.5 0 010-1zm4.3 5.2H2V10h3.8V6.2z"
                fill="#999"
              />
            </g>
          </svg>
          Viewports addon in the toolbar
        </div>
      </section>
      <style>
        .storybook-page {
          margin: 0 auto;
          padding: 48px 20px;
          max-width: 600px;
          color: #333;
          font-size: 14px;
          line-height: 24px;
          font-family: 'Nunito Sans', 'Helvetica Neue', Helvetica, Arial, sans-serif;
        }

        .storybook-page h2 {
          display: inline-block;
          vertical-align: top;
          margin: 0 0 4px;
          font-weight: 700;
          font-size: 32px;
          line-height: 1;
        }

        .storybook-page p {
          margin: 1em 0;
        }

        .storybook-page a {
          color: inherit;
        }

        .storybook-page ul {
          margin: 1em 0;
          padding-left: 30px;
        }

        .storybook-page li {
          margin-bottom: 8px;
        }

        .storybook-page .tip {
          display: inline-block;
          vertical-align: top;
          margin-right: 10px;
          border-radius: 1em;
          background: #e7fdd8;
          padding: 4px 12px;
          color: #357a14;
          font-weight: 700;
          font-size: 11px;
          line-height: 12px;
        }

        .storybook-page .tip-wrapper {
          margin-top: 40px;
          margin-bottom: 40px;
          font-size: 13px;
          line-height: 20px;
        }

        .storybook-page .tip-wrapper svg {
          display: inline-block;
          vertical-align: top;
          margin-top: 3px;
          margin-right: 4px;
          width: 12px;
          height: 12px;
        }

        .storybook-page .tip-wrapper svg path {
          fill: #1ea7fd;
        }
      </style>
    </article>
  `,
})

const meta = {
  title: 'Example/Page',
  component: MyPage,
  render: () => ({
    components: { MyPage },
    template: '<my-page />',
  }),
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  // This component will have an automatically generated docsPage entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
} satisfies Meta<typeof MyPage>

export default meta
type Story = StoryObj<typeof meta>

// More on component testing: https://storybook.js.org/docs/writing-tests/interaction-testing
export const LoggedIn: Story = {
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    const loginButton = canvas.getByRole('button', { name: /Log in/i })
    await expect(loginButton).toBeInTheDocument()
    await userEvent.click(loginButton)
    await expect(loginButton).not.toBeInTheDocument()

    const logoutButton = canvas.getByRole('button', { name: /Log out/i })
    await expect(logoutButton).toBeInTheDocument()
  },
}

export const LoggedOut: Story = {}
