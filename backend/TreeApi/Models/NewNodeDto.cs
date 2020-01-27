﻿using System.Collections.Generic;

namespace TreeApi.Models
{
	public class NewNodeDto
	{
		public int? ParentId { get; set; }
		public string Name { get; set; }
		public List<NewNodeDto> Children { get; set; } = new List<NewNodeDto>();
	}

}