import $ from 'jquery';
import { hideFeedsImgs, containerContentChange } from '../utils/Observer.ts';
import initVue from './initVue.ts';
import './styles/main.scss';

$(document).ready(() => {
  $('#app').addClass('xhs-moyu-plugin');
  hideFeedsImgs();
  $('.header-logo').hide();
  try {
    initVue();
  } catch (error) {
    console.log('initVue =========> ', error)
  }
  containerContentChange();
});