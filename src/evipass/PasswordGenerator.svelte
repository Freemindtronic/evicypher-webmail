<script lang="ts">
  let password = ''
  let passphrase = ''
  const passwordLength = 16
  const passphraseLength = 4
  const specialChars = '!@#$%^&*()_+-=[]{}\\|;:\'",.<>/?'

  // ...
  function generatePassword(length: number) {
    password = ''
    for (let i = 0; i < length; i++) {
      let char: string
      if (i % 3 === 0) {
        char = String.fromCodePoint(Math.floor(Math.random() * 10) + 48)
      } else if (i % 3 === 1) {
        char = String.fromCodePoint(Math.floor(Math.random() * 26) + 65)
      } else {
        char = specialChars.charAt(
          Math.floor(Math.random() * specialChars.length)
        )
      }

      password += char
    }

    return password
  }

  async function generatePassphrase(length: number): Promise<string> {
    const dictionary = await fetch(
      `https://api.datamuse.com/words?rel_jjb=kitchen`
    )
      .then(async (response) => response.json())

      .then((words) => {
        const myWords = words.map((word: { word: string }) => word.word)
        return myWords as string[]
      })

    let passphrase = ''
    for (let i = 0; i < length; i++) {
      passphrase += `${
        dictionary[Math.floor(Math.random() * dictionary.length)]
      } -`
    }

    return passphrase.slice(0, -1)
  }

  const passphraseElement = document.querySelector('passphrase')
  if (passphraseElement)
    passphraseElement.textContent += passphrase.slice(0, -1) + '<br>'
</script>

<button
  on:click={() => {
    generatePassword(passwordLength)
  }}
>
  Generate Password
</button>

<!-- <div id="passphrase-container">
  <button
    on:click={async () => {
      const passphrase = await generatePassphrase(passphraseLength)
      // eslint-disable-next-line unicorn/prefer-query-selector
      const passphraseContainer = document.getElementById(
        'passphrase-container'
      )
      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression

      // const passphraseElement = document.querySelector('passphrase')
      if (passphraseContainer)
        // eslint-disable-next-line no-unsanitized/property
        passphraseContainer.innerHTML += passphrase.slice(0, -1) + '<br>'

      // eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
    }}
  >
    Generate Passphraseyar
  </button>
</div> -->
<div id="passphrase">
  <button
    on:click={() => {
      generatePassphrase(passphraseLength)
        .then((newPassphrase) => {
          passphrase = newPassphrase
        })
        .catch((error) => {
          console.error(error)
        })
    }}
  >
    Generate Passphrase
  </button>
</div>
<input type="number" bind:value={password} />
<input class="poopup" type="text" bind:value={passphrase} />

<p>{password}</p>

<style lang="scss">
  .poopup {
    display: block;
    margin: 50px auto;
    width: 340px;
    height: 40px;
    padding: 10px;
    font-size: 20px;
    box-shadow: 2px 2px 10px #ccc;
    text-align: center;
  }
  .dictionaries {
    display: contents;
    margin: 50px auto;
    width: 340px;
    height: 40px;
    padding: 10px;
    font-size: 20px;
  }
</style>
