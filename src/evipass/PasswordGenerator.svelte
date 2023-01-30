<script lang="ts">
  import { onMount } from 'svelte'
  import { isLoading, _ } from '$/i18n'

  /**
   * Variables used to store the current state of the password generator.
   *
   * @property {string} copiedAlert - Message to be displayed to the user.
   * @property {number} entropy - The entropy of the generated password.
   * @property {number} entropyBarColor - Color of the entropy bar.
   * @property {number} length - The desired length of the generated password.
   * @property {boolean} useUpperCase - Indicates whether to include uppercase
   *   characters in the generated password.
   * @property {boolean} useLowerCase - Indicates whether to include lowercase
   *   characters in the generated password.
   * @property {boolean} useNumbers - Indicates whether to include numbers in
   *   the generated password.
   * @property {boolean} useAll - Indicates whether to include all special
   *   characters in the generated password.
   * @property {string} password - The generated password.
   * @property {Object[]} specialChars - An array of special characters, each of
   *   which contains a name and selected property.
   */
  let copiedAlert = ''
  let entropy = 0
  let entropyBarColor = 0
  let length = 16
  let useUpperCase = true
  let useLowerCase = true
  let useNumbers = true
  let useAll = true
  let password = ''
  let specialChars = [
    { name: '!', selected: true },
    { name: '"', selected: true },
    { name: '#', selected: true },
    { name: '$', selected: true },
    { name: '%', selected: true },
    { name: '&', selected: true },
    { name: "'", selected: true },
    { name: '(', selected: true },
    { name: ')', selected: true },
    { name: '*', selected: true },
    { name: '+', selected: true },
    { name: ',', selected: true },
    { name: '-', selected: true },
    { name: '.', selected: true },
    { name: '/', selected: true },
    { name: ':', selected: true },
    { name: ';', selected: true },
    { name: '<', selected: true },
    { name: '=', selected: true },
    { name: '>', selected: true },
    { name: '?', selected: true },
    { name: '@', selected: true },
    { name: '[', selected: true },
    { name: '\\', selected: true },
    { name: ']', selected: true },
    { name: '^', selected: true },
    { name: '_', selected: true },
    { name: '`', selected: true },
    { name: '{', selected: true },
    { name: '|', selected: true },
    { name: '}', selected: true },
    { name: '~', selected: true },
  ]

  /**
   * Generates a new password based on the selected options. It uses a string
   * variable "charSet" to store the characters that will be used in the
   * password. Depending on the options selected, it adds uppercase letters,
   * lowercase letters, special characters, and numbers to the "charSet" variable.
   */ const generatePassword = () => {
    password = ''
    let charSet = ''
    copiedAlert = ''
    if (useUpperCase) charSet += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (useLowerCase) charSet += 'abcdefghijklmnopqrstuvwxyz'
    const selectedSpecialChars = specialChars
      .filter((char) => char.selected)
      .map((char) => char.name)
    charSet += selectedSpecialChars.join('')

    if (useNumbers) charSet += '0123456789'
    for (let i = 0; i < length; i++)
      password += charSet.charAt(Math.floor(Math.random() * charSet.length))

    calculatePasswordEntropy(password)
    calculatePointPosition(entropy)
  }

  /**
   * An array of objects representing entropy ranges and corresponding color
   * ranges. Each object has the following properties:
   *
   * @typedef {Object} Range
   * @type {Range[]}
   * @property {number} min - The minimum value of the entropy range.
   * @property {number} max - The maximum value of the entropy range.
   * @property {number} colorMin - The minimum value of the color range.
   * @property {number} colorMax - The maximum value of the color range.
   */

  const ranges = [
    { min: 0, max: 64, colorMin: 0, colorMax: 20 },
    { min: 65, max: 81, colorMin: 20, colorMax: 40 },
    { min: 82, max: 103, colorMin: 40, colorMax: 60 },
    { min: 104, max: 129, colorMin: 60, colorMax: 80 },
    { min: 130, max: 200, colorMin: 80, colorMax: 100 },
    { min: 201, max: Number.POSITIVE_INFINITY, colorMin: 100, colorMax: 100 },
  ]

  const calculatePointPosition = (entropy: number) => {
    for (const range of ranges) {
      if (entropy >= range.min && entropy <= range.max) {
        const x1 = range.min
        const y1 = range.colorMin
        const x2 = range.max
        const y2 = range.colorMax
        entropyBarColor = ((entropy - x1) * (y2 - y1)) / (x2 - x1) + y1
        break
      }
    }
  }

  /**
   * The function maps through the specialChars array and sets the selected
   * property to the opposite of the provided value.
   *
   * @function selectAll
   * @param {boolean} value - The boolean value to set the selected property of
   *   all specialChars objects
   */
  const selectAll = (value: boolean) => {
    specialChars = value
      ? specialChars.map((char) => ({ ...char, selected: false }))
      : specialChars.map((char) => ({ ...char, selected: true }))
  }

  /**
   * Copies the current password to the clipboard
   *
   * @param {string} password - The current generated password
   */
  const copyPassword = (password: string) => {
    void navigator.clipboard.writeText(password)
    copiedAlert = $_('copied')
  }

  /**
   * This function is called when the component is mounted. It calls the
   * generatePassword() function.
   *
   * @function
   */
  onMount(() => {
    generatePassword()
  })

  /**
   * Function to calculate the position of a point based on its entropy.
   *
   * @function
   * @param {number} entropy - The entropy value to be used to calculate the
   *   point's position.
   * @returns {void}
   */
  const calculatePasswordEntropy = (password: string) => {
    const printableASCII = Array.from({ length: 126 - 31 }, (_, i) =>
      String.fromCodePoint(i + 32)
    )
    entropy = Math.round(
      [...password]
        .map((char) => printableASCII.indexOf(char))
        .filter((index) => index !== -1)
        .reduce((entropy, index) => entropy + Math.log2(index), 0)
    )
  }
</script>

{#if !$isLoading}
  <div class="content">
    <h3 class="header">{$_('generate-password')}</h3>
    <div>
      <label for="length">{$_('length')}</label>
      <input
        style="border-color: black;"
        type="number"
        bind:value={length}
        min="1"
        max="60"
        step="1"
        id="length"
      />
    </div>
    <div class="container">
      <div>
        <label for="useUpperCase"> {$_('upper-case')}</label>
        <input type="checkbox" bind:checked={useUpperCase} id="useUpperCase" />
      </div>
      <div>
        <label for="useNumbers"> {$_('numbers')}</label>
        <input type="checkbox" bind:checked={useNumbers} id="useNumbers" />
      </div>
      <div>
        <label for="useLowerCase"> {$_('lower-case')}</label>
        <input type="checkbox" bind:checked={useLowerCase} id="useLowerCase" />
      </div>
      <div>
        <label for="useAll">{$_('special-characters')}</label>
        <input
          type="checkbox"
          bind:checked={useAll}
          id="useAll"
          on:click={() => {
            selectAll(useAll)
          }}
        />
      </div>
    </div>

    <div class="checkbox-grid">
      {#each specialChars as char}
        <label for={char.name}> {char.name}</label>
        <input type="checkbox" bind:checked={char.selected} id={char.name} />
      {/each}
    </div>

    <div class="password-container">
      <input class="password-paragraph" value={password} readonly />
      <div class="icon-container">
        <i on:click={generatePassword} class="fa-solid fa-rotate" />
        <i
          on:click={() => {
            copyPassword(password)
          }}
          class="fa-solid fa-clipboard"
        />
      </div>
    </div>

    <p>Entropy {entropy} bits</p>
    <div class="bar-container">
      <div class="red-bar" />
      <div class="orange-bar" />
      <div class="yellow-bar" />
      <div class="light-green-bar" />
      <div class="dark-green-bar" />
      <div class="point" style="left:{entropyBarColor}%" />
    </div>
    <p>{copiedAlert}</p>
  </div>
{/if}

<style>
  .checkbox-grid {
    display: grid;
    grid-gap: 2px;
    grid-template-columns: repeat(24, 1fr);
  }

  .header {
    margin: 2%;
    border-bottom: 2px solid #f0f2f5;
  }

  .container {
    display: flex;
    justify-content: space-between;
    padding: 2%;
  }

  .content {
    padding: 2%;
  }

  .password-container {
    display: flex;
    align-items: center;
    margin: 2%;
    border-style: groove;
  }
  .password-container i:last-child {
    margin-left: auto;
  }
  .password-paragraph {
    width: 100%;
  }

  .icon-container {
    display: grid;
    grid-template-columns: 20px 20px 20px;
  }

  /* EntropyBar.svelte */
  .bar-container {
    position: relative;
    width: 100%;
    height: 5px;
    margin: 2%;
  }

  .red-bar {
    position: absolute;
    left: 0;
    width: 20%;
    height: 100%;
    background: linear-gradient(to right, red, orange);
  }

  .orange-bar {
    position: absolute;
    left: 20%;
    width: 20%;
    height: 100%;
    background: linear-gradient(to right, orange, yellow);
  }

  .yellow-bar {
    position: absolute;
    left: 40%;
    width: 20%;
    height: 100%;
    background: linear-gradient(to right, yellow, lightgreen);
  }

  .light-green-bar {
    position: absolute;
    left: 60%;
    width: 20%;
    height: 100%;
    background: linear-gradient(to right, lightgreen, green);
  }
  .dark-green-bar {
    position: absolute;
    left: 80%;
    width: 20%;
    height: 100%;
    background-color: green;
  }

  .point {
    position: absolute;
    top: 50%;
    width: 10px;
    height: 10px;
    background-color: #092a35;
    border-radius: 50%;
    transform: translateY(-50%);
    transform: translateY(-50%);
  }
</style>
