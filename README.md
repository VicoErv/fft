# FFT Beta [![Build Status](https://travis-ci.org/VicoErv/fft.svg?branch=master)](https://travis-ci.org/VicoErv/fft)
For information please check [fft wiki](https://github.com/VicoErv/fft/wiki)

## Install
- Using git:
  
      $ pkg install git nodejs openssl openssh
      $ mkdir ~/fft && cd ~/fft
      $ git clone https://github.com/VicoErv
      $ npm install

- Using npm

      $ pkg install nodejs
      $ mkdir ~/fft && cd ~/fft
      $ npm install vfft

## Updating
- Using git:
      
      $ cd ~/fft && git pull --force

- Using npm:

      $ cd ~/fft && npm update


## Available Commands :
- User :
    - add `add new user`
    - list `list added user`
    - remove `remove added user`

- Comment
    - comment `add new comment`
    - clist `list added comment`

 - Program
    - use `set user for fft program`
        - `index of user in list table`
        - `using username of added user`
    - run `start fft program`
        - -silent `run fft without comment`
    - unfollow `unfollow not following back`
    - exit `exit program`