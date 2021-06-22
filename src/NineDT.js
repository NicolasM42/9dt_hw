import React from 'react';
import { 
    Box,
    Grid,
    Paper,
    AppBar,
    Typography, 
    Button, 
    Divider,
} from '@material-ui/core';

import TileIcon from '@material-ui/icons/FiberManualRecord';
import DropIcon from '@material-ui/icons/ArrowDownward';

// color and style constants
const white = "#ffffff";
const themeGreen = "#15943d";
const emptyGrey = "#b8b9ba";
const p1Red = "#d60f0f";
const p2Blue = "#3128d4";
const standardPadding = "10px";
const tileDim = "90%";

class NineDT extends React.Component {
    
    // INITIAL STATE SETUP
    state = {
        currMoveSet: [],
        board: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],
        response: "",
        gameActive: false,
        gameStatus: "Not Yet Started",
        botsTurn: false,
        buttonsDisabled: true,
        col0Full: false,
        col1Full: false,
        col2Full: false,
        col3Full: false,
        startMenuDisplay: 'inline',
        playAgainDisplay: 'none'
    }

    //// HELPER FUNCTION: Initializes 9dt game after user selects their desired Player1.
    //   -Parameters: botGoingFirst (bool) Used to initialize the bot's first move.
    //   -Returns: None
    initGame(botGoingFirst) {
        this.setState({
            gameActive: true,
            startMenuDisplay: 'none'
        });
        
        if (botGoingFirst) {
            this.setState({
                gameStatus: "Bot's Move",
                botsTurn: true
            }, () => {this.initBotsMove()}); 
        }
        else {
            this.setState({
                buttonsDisabled: false,
                gameStatus: "Your Move"
            });
        }
    }

    //// HELPER FUNCTION: Returns the appropriate tile based on the given board slot.
    //   -Parameters: slot (int) 0 represents empty (grey), 1 represents P1 (red), 2 represents P2 (blue)
    //   -Returns: Tile icon with appropriate color.
    drawTile(slot) {
        if (slot === 1)  {
            return (<TileIcon style={{color: p1Red, width:tileDim, height: tileDim}}/>)
        }
        else if (slot === 2) {
            return (<TileIcon style={{color: p2Blue, width:tileDim, height: tileDim}}/>)
        }
        else {
            return (<TileIcon style={{color: emptyGrey, width:tileDim, height: tileDim}}/>)
        }
    }

    //// HELPER FUNCTION: Adds the user's move to the move set and updates the board.
    //   -Parameters: col (int) Variable representing the desired column in which to drop the tile
    //   -Returns: None
    addMove(col) {
        this.setState({
            gameStatus: "Bot's Move",
            buttonsDisabled: true
        });
        
        let temp_set = this.state.currMoveSet;
        temp_set.push(col);
        this.setState({
            currMoveSet: temp_set, 
            botsTurn: true
        }, () => {this.updateBoard(temp_set)});
    }

    //// HELPER FUNCTION: Initiates the Bot's move if the game is active and its the Bot's turn.
    //   -Parameters: None
    //   -Returns: None
    initBotsMove() {
        if (this.state.botsTurn && this.state.gameActive) {
            let temp_set = this.state.currMoveSet;
            this.fetchFromEndpoint("[" + temp_set.toString() + "]");
            this.setState({ botsTurn: false });
        }
    }

    //// HELPER FUNCTION: Handles fetching from the AWS endpoint.
    //   -Parameters: moveSet (string) The current list of moves.
    //   -Returns: The response from the endpoint
    fetchFromEndpoint(moveSet) {
        let api = "https://w0ayb2ph1k.execute-api.us-west-2.amazonaws.com/production?moves="

        fetch(api + moveSet, {mode: 'cors'})
            .then(function(response) {
                return response.text();
            })
            .then(text => {
                this.setState({response: text}, () => {this.buildMoveSet(text)});
            })
            .catch(function(error) {
                console.log('Request failed ', error)
            });
    }

    //// HELPER FUNCTION: Converts the AWS response string to a readable array.
    //   -Parameters: response (string) Text returned from AWS endpoint
    //   -Returns: None
    buildMoveSet(response) {
        let temp_str = response.substring(1, response.length-1); // remove brackets from response
        let split_set = temp_str.split(','); // split the string using the ',' as the delimitor
        let temp_set = [];

        // parse the char array, removing the leading space and converting the chars to ints
        for (let i = 0; i < split_set.length; i++) {
            let move = parseInt(split_set[i]);
            temp_set.push(move);
        }

        this.setState({
            currMoveSet: temp_set,
            buttonsDisabled: false,
            gameStatus: "Your Move"
        }, () => {this.updateBoard(temp_set)});
    }

    //// HELPER FUNCTION: Builds the board array using the moveSet array
    //   -Parameters: moveSet (array) Read to place tiles
    //   -Returns: None
    updateBoard(moveSet) {
        let temp_board = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];

        for (let i = 0; i < moveSet.length; i++) {
            let col = moveSet[i];
            let player = (i % 2) + 1; // calculate which player's move it is based on the move's position in the array

            for (let j = 3; j >= 0; j--) { // find the first available empty slot, starting at the bottom of the column
                if (temp_board[j][col] === 0) {
                    temp_board[j][col] = player;
                    break;
                }
            }
        }

        this.setState({board: temp_board}, () => {this.checkForWinner(temp_board)});
    }

    //// HELPER FUNCTION: Checks for whether the current board satisfies any of the win conditions.
    //   -Parameters: None
    //   -Returns: None
    checkForWinner() {
        let t = this.state.board;
        let botsTurn = this.state.botsTurn;

        // check rows
        for (let i = 0; i <= 3; i++) {
            if ((t[i][0] !== 0) && (t[i][0] === t[i][1] && t[i][1] === t[i][2] && t[i][2] === t[i][3])) {
                this.setState({
                    gameStatus: botsTurn ? "You won!": "The Bot won!",
                    buttonsDisabled: true,
                    playAgainDisplay: 'inline'
                });
                return;
            }
        }

        // check cols
        for (let j = 0; j <= 3; j++) {
            if ((t[0][j] !== 0) && (t[0][j] === t[1][j] && t[1][j] === t[2][j] && t[2][j] === t[3][j])) {
                this.setState({
                    gameStatus: botsTurn ? "You won!": "The Bot won!",
                    buttonsDisabled: true,
                    playAgainDisplay: 'inline'
                });
                return;
            }
        }

        // check diagonal (top left -> bottom right)
        if ((t[0][0] !== 0) && (t[0][0] === t[1][1] && t[1][1] === t[2][2] && t[2][2] === t[3][3])) {
            this.setState({
                gameStatus: botsTurn ? "You won!": "The Bot won!",
                buttonsDisabled: true,
                playAgainDisplay: 'inline'
            });
            return;
        }

        // check diagonal (bottom left -> top right)
        if ((t[3][0] !== 0) && (t[3][0] === t[2][1] && t[2][1] === t[1][2] && t[1][2] === t[0][3])) {
            this.setState({
                gameStatus: botsTurn ? "You won!": "The Bot won!",
                buttonsDisabled: true,
                playAgainDisplay: 'inline'
            });
            return;
        }

        this.checkForDraw(); // if no winner, check for a draw
    }

    //// HELPER FUNCTION: Checks for whether the current board is full, or has any full columns.
    //   -Parameters: None
    //   -Returns: None
    checkForDraw() {
        let b = this.state.board;
        let boardFull = false;
        let col0Full = false;
        let col1Full = false;
        let col2Full = false;
        let col3Full = false;
        
        // column checks
        if (b[0][0] !== 0) {
            col0Full = true;
        }
        if (b[0][1] !== 0) {
            col1Full = true;
        }
        if (b[0][2] !== 0) {
            col2Full = true;
        }
        if (b[0][3] !== 0) {
            col3Full = true;
        }

        this.setState({
            col0Full: col0Full,
            col1Full: col1Full,
            col2Full: col2Full,
            col3Full: col3Full
        })

        // whole board check
        if (col0Full && col1Full && col2Full && col3Full) {
            boardFull = true;
        }

        if (boardFull) {
            this.setState({
                gameStatus: "Its a draw!",
                buttonsDisabled: true,
                playAgainDisplay: 'inline',
                gameActive: false
            });
        }
        else {
            this.initBotsMove();
        }
    }

    //// HELPER FUNCTION: Reset the game to its initial state
    //   -Parameters: None
    //   -Returns: None
    restartGame() {
        this.setState({
            currMoveSet: [],
            board: [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]],
            response: "",
            gameActive: false,
            gameStatus: "Not Yet Started",
            botsTurn: false,
            buttonsDisabled: true,
            col0Full: false,
            col1Full: false,
            col2Full: false,
            col3Full: false,
            startMenuDisplay: 'inline',
            playAgainDisplay: 'none'
        })
    }
    
    //// RENDER FUNCTION: Renders all of the UI to the page.
    render() {
        return(
            <div>
                <AppBar style={{background: themeGreen}} position="static">
                    <h1>Nick's 9dt</h1>
                </AppBar>

                <div style={{display: this.state.startMenuDisplay}}>
                    <Typography variant="h5" style={{margin: standardPadding}}>Choose who goes first!</Typography>
                    <Button 
                        variant="outlined" 
                        style={{color: themeGreen}} 
                        onClick={() => this.initGame(false)}
                    >You</Button>
                    <Typography variant="h6">-OR-</Typography>
                    <Button 
                        variant="outlined" 
                        style={{color: themeGreen}} 
                        onClick={() => this.initGame(true)}
                    >The Bot</Button>
                    <Divider style={{margin: standardPadding, marginTop: '20px'}}/>
                </div>

                <Box display="flex" style={{justifyContent:"center"}}>
                    <Grid container spacing={2} direction="column" style={{padding: standardPadding, maxWidth: '500px'}}>
                        <Grid container item spacing={2}>
                            <Grid item xs={3}><Button disabled={this.state.buttonsDisabled || this.state.col0Full} onClick={() => this.addMove(0)}><DropIcon/></Button></Grid>
                            <Grid item xs={3}><Button disabled={this.state.buttonsDisabled || this.state.col1Full} onClick={() => this.addMove(1)}><DropIcon/></Button></Grid>
                            <Grid item xs={3}><Button disabled={this.state.buttonsDisabled || this.state.col2Full} onClick={() => this.addMove(2)}><DropIcon/></Button></Grid>
                            <Grid item xs={3}><Button disabled={this.state.buttonsDisabled || this.state.col3Full} onClick={() => this.addMove(3)}><DropIcon/></Button></Grid>
                        </Grid>
                        {this.state.board.map((col) => (
                            <Grid container item spacing={2}>
                                {col.map((slot) => (
                                    <Grid item xs={3}>
                                        <Paper style={{flexGrow: 1, background: emptyGrey}}>
                                            {this.drawTile(slot)}
                                        </Paper>
                                    </Grid>
                                ))} 
                            </Grid>    
                        ))}
                    </Grid>
                </Box>

                <Divider variant="middle" style={{margin: standardPadding}}/>
                <Typography variant="h5">Game Status: {this.state.gameStatus}</Typography>
                <Button 
                    style={{display: this.state.playAgainDisplay, background: themeGreen, color: white, margin: standardPadding}} 
                    onClick={() => this.restartGame()}
                >Play Again</Button>
            </div>
        );
    }
}

export default NineDT;