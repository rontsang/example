import { Component } from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";

@Component({
  selector: 'app-component1',
  templateUrl: './component1.component.html',
  styleUrl: './component1.component.css'
})
export class Component1Component {
  pageTitle: string = 'component 1';
  id: string | null;

  constructor(private route: ActivatedRoute, private router : Router){
      this.id = this.route.snapshot.paramMap.get('id')
      console.log("Route parameter is: " + this.id)
    // this.route.paramMap.subscribe(
    //   params => console.log("Route parameter is: " + params.get('id'))
    // );
    // console.log("Route parameter is: " + this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') || '';
  }

  onBack():void{
    this.router.navigate(['/']);
  }

}
