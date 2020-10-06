# stakehound-inspector
CLI and libraries for inspecting ether transfers from and to given addresses. It uses RxJs library to handle
event streams.

## Usage

### Install

```
npm install
```

### Test

```
npm test
```

### Generate documentation

```
npm run gendoc
```

### Run

```
npm start <custody> <sender> [initial_block] [poll_interval]
```

The entry point of the program is `./start.ts`. `index.ts` is intended to be the library export, so it can be used on other programs.

The state is stored at `./data/` directory. If the `MINT_PROGRESS.TXT` and `SEND_PROGRESS.TXT` are not present then
the services will start scanning from the initial block configuration input. So they are essential to not lose
transaction nor duplicate entries.

It is recommended to set the `initial_block` to something close so you don't have to scan blocks that you are sure
do not contain addresses of interest.

The `MintLogger` and `SendLogger` are designed to run independently from each other, so they have their own progress state.