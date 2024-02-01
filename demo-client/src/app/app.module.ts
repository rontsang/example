import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {Component1Component} from "./component1/component1.component";
import {Component2Component} from "./component2/component2.component";
import {RouterModule} from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgxChartsModule }from '@swimlane/ngx-charts';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { LineChartComponent } from './line-chart/line-chart.component';
import { NgChartsModule } from 'ng2-charts';
import {BarChartComponent} from "./bar-chart/bar-chart.component";
import {UserInputComponent} from "./userinput/userinput.component";
import {ChartComponent} from "./chart/chart.component";
import { CurrencyFormatDirective } from './userinput/currency-format.directive';
import { DisplaywindowComponent } from './displaywindow/displaywindow.component';

// import {MoneyTimeChartComponent} from "./money-time-chart/money-time-chart.component";
// import {MoneyTimeChartComponent} from "./money-time-chart/money-time-chart.component";

@NgModule({
  declarations: [
    AppComponent,
    Component1Component,
    Component2Component,
    UserInputComponent,
    CurrencyFormatDirective
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    RouterModule,
    BrowserAnimationsModule,
    NgxChartsModule,
    LineChartComponent,
    BarChartComponent,
    ReactiveFormsModule,
    FormsModule,
    NgChartsModule,
    ChartComponent,
    DisplaywindowComponent
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
